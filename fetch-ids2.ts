async function run() {
  const q1 = await fetch('https://html.duckduckgo.com/html/?q=site:youtube.com+"no+copyright"+worship+instrumental');
  const t1 = await q1.text();
  console.log("Q1:", Array.from(new Set(t1.match(/v=([a-zA-Z0-9_-]{11})/g))).slice(0, 5));

  const q2 = await fetch('https://html.duckduckgo.com/html/?q=site:youtube.com+"dappytkeys"');
  const t2 = await q2.text();
  console.log("Q2:", Array.from(new Set(t2.match(/v=([a-zA-Z0-9_-]{11})/g))).slice(0, 5));
}
run();
