import { config } from "dotenv";
config({ path: ".env.local" });

async function test() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.log("No OPENROUTER_API_KEY found in .env.local");
    return;
  }
  
  console.log("Key found. Testing OpenRouter API...");
  
  const body = {
    model: "qwen/qwen2.5-vl-72b-instruct:free",
    messages: [
      {
        role: "user",
        content: "Hello",
      }
    ]
  };

  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": "https://40namnct.com",
        "X-Title": "NCT 40th Anniversary - Receipt OCR",
      },
      body: JSON.stringify(body)
    });
    
    if (!res.ok) {
      console.log("Error status:", res.status);
      console.log("Error body:", await res.text());
    } else {
      console.log("Success!");
      const data = await res.json();
      console.log(JSON.stringify(data.choices[0], null, 2));
    }
  } catch (err) {
    console.log("Fetch failed:", err);
  }
}

test();
