async function verifySeo() {
  console.log("Checking http://localhost:3001 ...");

  // 1. Robots.txt
  const robots = await fetch("http://localhost:3001/robots.txt").then((r) => r.text());
  console.log("\n--- [1] ROBOTS.TXT ---");
  console.log(robots.trim());

  // 2. Web App Manifest
  const manifest = await fetch("http://localhost:3001/manifest.webmanifest").then((r) => r.json());
  console.log("\n--- [2] MANIFEST.WEBMANIFEST ---");
  console.log(JSON.stringify(manifest, null, 2));

  // 3. Sitemap.xml
  const sitemap = await fetch("http://localhost:3001/sitemap.xml").then((r) => r.text());
  console.log("\n--- [3] SITEMAP.XML ---");
  console.log("Sitemap length:", sitemap.length, "bytes");
  console.log("Includes https://40namnctru.nctitc.io.vn/thu-ngo:", sitemap.includes("/thu-ngo"));
  console.log("Includes https://40namnctru.nctitc.io.vn/cau-chuyen/NCTru-breakdown:", sitemap.includes("/cau-chuyen/NCTru-breakdown"));
  console.log("Sample XML (first 400 chars):\n" + sitemap.substring(0, 400) + "...");

  // 4. Homepage HTML
  const homeHtml = await fetch("http://localhost:3001/").then((r) => r.text());
  console.log("\n--- [4] HOMEPAGE META & OPEN GRAPH ---");
  console.log("Has title:", /<title>(.*?)<\/title>/.test(homeHtml));
  const titleMatch = homeHtml.match(/<title>(.*?)<\/title>/);
  if (titleMatch) console.log("Title:", titleMatch[1]);
  console.log("Has og:image:", homeHtml.includes("og:image"));
  console.log("Has twitter:card:", homeHtml.includes("twitter:card"));
  console.log("Has canonical:", homeHtml.includes('rel="canonical"'));

  const ldJsonMatches = homeHtml.match(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g);
  console.log("\n--- [5] JSON-LD STRUCTURED DATA ---");
  console.log("Found JSON-LD script blocks:", ldJsonMatches ? ldJsonMatches.length : 0);
  if (ldJsonMatches) {
    const rawJson = ldJsonMatches[0].replace(/<script type="application\/ld\+json">|<\/script>/g, "");
    const parsed = JSON.parse(rawJson);
    console.log("Parsed JSON-LD Types in Graph:", parsed["@graph"].map((item) => item["@type"]));
    const school = parsed["@graph"].find((i) => i["@type"] === "School");
    console.log("School name:", school?.name);
    console.log("School address:", school?.address?.streetAddress, school?.address?.addressLocality);
    console.log("Events:", parsed["@graph"].filter((i) => i["@type"] === "Event").map((e) => ({ name: e.name, startDate: e.startDate })));
  }

  // 5. Thu Ngo Subpage HTML
  const thuNgoHtml = await fetch("http://localhost:3001/thu-ngo").then((r) => r.text());
  console.log("\n--- [6] THU NGO SUBPAGE ---");
  const tnTitle = thuNgoHtml.match(/<title>(.*?)<\/title>/);
  if (tnTitle) console.log("Thu Ngo Title:", tnTitle[1]);
  const tnCanonical = thuNgoHtml.match(/<link rel="canonical" href="(.*?)"\/>/);
  if (tnCanonical) console.log("Thu Ngo Canonical:", tnCanonical[1]);
  console.log("Has Breadcrumb JSON-LD:", thuNgoHtml.includes("BreadcrumbList"));
}

verifySeo().catch(console.error);
