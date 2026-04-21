async function run() {
  const q3 = await fetch('https://html.duckduckgo.com/html/?q=site:youtube.com+"soaking+in+his+presence"+"instrumental"');
  const t3 = await q3.text();
  console.log("Q3:", Array.from(new Set(t3.match(/v=([a-zA-Z0-9_-]{11})/g))).slice(0, 5));
}
run();
