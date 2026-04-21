async function run() {
  const apiKey = "AIzaSyDummyKeyForTestingAndSeeingIfOAuthIsNeededOrJustKeyIsInvalid";
  const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      input: { text: "test" },
      voice: { languageCode: "pt-BR" },
      audioConfig: { audioEncoding: "MP3" }
    })
  });
  console.log(response.status);
  console.log(await response.json());
}
run();
