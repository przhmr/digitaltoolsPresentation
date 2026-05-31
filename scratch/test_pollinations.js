const https = require('https');

const prompt = encodeURIComponent("Professional modern presentation slide asset, clean educational vector style, high-fidelity: chivito astronauta");
const url = `https://image.pollinations.ai/prompt/${prompt}?width=600&height=400&nologo=true&seed=42`;

console.log("Fetching url:", url);

https.get(url, (res) => {
  console.log("Status Code:", res.statusCode);
  console.log("Headers:", res.headers);
  
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log("Body length:", body.length);
    if (res.statusCode !== 200) console.log("Body:", body);
  });
}).on('error', (e) => {
  console.error("Error:", e);
});
