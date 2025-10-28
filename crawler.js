// crawler.js
import fs from "fs/promises";
import fetch from "node-fetch";
import minimist from "minimist";
import xml2js from "xml2js";
import puppeteer from "puppeteer";
import { AxePuppeteer } from "axe-puppeteer";
import pa11y from "pa11y";
import path from "path";

const args = minimist(process.argv.slice(2));
const startUrl = args.url || args.u;
const maxDepth = parseInt(args.depth || "1", 10);
const out = args.out || "rgaa-full-report.json";
if (!startUrl) {
  console.error("Usage: node crawler.js --url=https://example.com [--depth=2] [--out=report.json]");
  process.exit(1);
}

// Load mapping
const mapping = JSON.parse(await fs.readFile("./rgaa-mapping.json", "utf-8"));

async function getSitemapUrls(baseUrl) {
  try {
    const sitemapUrl = new URL("/sitemap.xml", baseUrl).href;
    const res = await fetch(sitemapUrl);
    if (!res.ok) throw new Error("No sitemap found");
    const text = await res.text();
    const parsed = await xml2js.parseStringPromise(text);
    const urls = parsed.urlset.url.map(u => u.loc[0]);
    return urls;
  } catch {
    return [];
  }
}

async function crawlDOM(baseUrl, depth = 1) {
  const visited = new Set();
  const toVisit = [baseUrl];
  const urls = [];
  const browser = await puppeteer.launch({ args: ["--no-sandbox", "--disable-setuid-sandbox"] });
  while (toVisit.length > 0 && urls.length < 50) {
    const current = toVisit.shift();
    if (visited.has(current) || (new URL(current).origin !== new URL(baseUrl).origin)) continue;
    visited.add(current);
    urls.push(current);
    if (visited.size > depth * 10) break;

    try {
      const page = await browser.newPage();
      await page.goto(current, { waitUntil: "domcontentloaded", timeout: 30000 });
      const links = await page.$$eval("a[href]", as => as.map(a => a.href).filter(h => h.startsWith("http")));
      for (const l of links) {
        if (!visited.has(l) && new URL(l).origin === new URL(baseUrl).origin) {
          toVisit.push(l);
        }
      }
      await page.close();
    } catch {}
  }
  await browser.close();
  return Array.from(new Set(urls)).slice(0, 20);
}

async function runAxe(page) {
  return await new AxePuppeteer(page).analyze();
}

async function runPa11y(url) {
  return await pa11y(url, {
    standard: "WCAG2AA",
    chromeLaunchConfig: {
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    }
  });
}

function mapIssuesToRGAA(issues) {
  return issues.map(issue => {
    const key = issue.id || issue.code || issue.key;
    const entry = mapping[key] || {};
    return {
      source: issue.source,
      id: issue.id || issue.code,
      impact: issue.impact || issue.type || "unknown",
      description: issue.description || issue.message,
      rgaa_items: entry.rgaa_items || [],
      rgaa_explanation: entry.explanation || "No RGAA mapping found"
    };
  });
}

function computeScore(mapped) {
  const weights = { critical: 5, serious: 3, moderate: 2, minor: 1, notice: 0.5, unknown: 1 };
  const total = mapped.reduce((acc, m) => acc + (weights[m.impact] || 0), 0);
  const penalty = total / 10;
  const score = Math.max(0, Math.min(100, 100 - penalty));
  return parseFloat(score.toFixed(2));
}

async function auditPage(url, browser) {
  const page = await browser.newPage();
  try {
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
    const axeResults = await runAxe(page);
    const pa11yResults = await runPa11y(url);
    const axeIssues = (axeResults.violations || []).map(v => ({ ...v, source: "axe" }));
    const paIssues = (pa11yResults.issues || []).map(v => ({ ...v, source: "pa11y" }));
    const combined = [...axeIssues, ...paIssues];
    const mapped = mapIssuesToRGAA(combined);
    const score = computeScore(mapped);
    return { url, score, issues: mapped };
  } catch (err) {
    return { url, error: err.message, issues: [] };
  } finally {
    await page.close();
  }
}

(async () => {
  console.log("🔍 Collecte des URLs...");
  let urls = await getSitemapUrls(startUrl);
  if (urls.length === 0) {
    console.log("Aucun sitemap détecté, crawling DOM...");
    urls = await crawlDOM(startUrl, maxDepth);
  }
  console.log(`Pages à auditer (${urls.length}):`, urls.slice(0, 10), urls.length > 10 ? "..." : "");

  const browser = await puppeteer.launch({ args: ["--no-sandbox", "--disable-setuid-sandbox"] });
  const reports = [];
  for (const url of urls) {
    console.log("→ Audit:", url);
    const result = await auditPage(url, browser);
    reports.push(result);
  }
  await browser.close();

  const validReports = reports.filter(r => !r.error);
  const avgScore = validReports.length
    ? validReports.reduce((acc, r) => acc + r.score, 0) / validReports.length
    : 0;

  const finalReport = {
    metadata: {
      startUrl,
      date: new Date().toISOString(),
      pages_audited: validReports.length,
      avg_score: avgScore,
      status: avgScore >= 85 ? "Conforme" : avgScore >= 60 ? "Partiellement conforme" : "Non conforme"
    },
    pages: reports
  };

  await fs.writeFile(out, JSON.stringify(finalReport, null, 2));
  console.log("✅ Rapport global écrit dans", out);
  console.log(`Score moyen RGAA: ${avgScore.toFixed(2)} (${finalReport.metadata.status})`);
})();