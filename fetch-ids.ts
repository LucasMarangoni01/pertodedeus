async function run() {
  const res = await fetch('https://html.duckduckgo.com/html/?q=site:youtube.com+"worship+instrumental"+"no+copyright"');
  const text = await res.text();
  const matches = text.match(/v=([a-zA-Z0-9_-]{11})/g);
  if (matches) {
    console.log(Array.from(new Set(matches)));
  } else {
    console.log("No matches");
  }
}
run();
