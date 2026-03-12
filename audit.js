import fs from "fs";
import path from "path";
import * as ChromeLauncher from "chrome-launcher";
import lighthouse from "lighthouse";

function usageAndExit() {
    console.error('Usage: node audit.js "<url>" "<output.json>"');
    console.error('Example: node audit.js "https://example.com" "./out/report.json"');
    process.exit(1);
}

function ensureUrlHasProtocol(raw) {
    const s = String(raw || "").trim();
    if (!s) return "";
    if (/^https?:\/\//i.test(s)) return s;
    return "https://" + s;
}

async function runAudit(url) {
    let chrome;

    try {
        chrome = await ChromeLauncher.launch({
            chromeFlags: [
                "--headless",
                "--no-sandbox",
                "--disable-dev-shm-usage",
                // "--ignore-certificate-errors",
            ],
        });

        const options = {
            logLevel: "info",
            output: "json",
            onlyCategories: ["seo"],
            port: chrome.port,
        };

        return await lighthouse(url, options);
    } finally {
        if (chrome) await chrome.kill();
    }
}

async function main() {
    const urlArg = process.argv[2];
    const outPathArg = process.argv[3];

    if (!urlArg || !outPathArg) usageAndExit();

    const website = ensureUrlHasProtocol(urlArg);
    const outPath = String(outPathArg).trim();

    const result = await runAudit(website);

    const output = {
        Website: website,
        seo: Math.round((result?.lhr?.categories?.seo?.score ?? 0) * 100),
        report: result?.lhr ?? null,
    };

    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, JSON.stringify(output, null, 2), "utf8");

    console.log(outPath);
}

main().catch((err) => {
    console.error(err?.stack || err?.message || String(err));
    process.exit(1);
});