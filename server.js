require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const PORT = process.env.PORT || 3001; // Default to 3001 if not specified

// Initialize Gemini with correct API version
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Use the correct model name
const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
  apiVersion: "v1",
});

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

// Chat history for context
const chatHistory = new Map();

// Generate response using Gemini
async function generateResponse(userId, message) {
  try {
    // Get or initialize chat session
    if (!chatHistory.has(userId)) {
      chatHistory.set(
        userId,
        model.startChat({
          history: [
            {
              role: "user",
              parts: [
                {
                  text: `You are Akkusu GPT...`, // [Your existing prompt here]
                },
              ],
            },
            {
              role: "model",
              parts: [
                {
                  text: `You are Akkusu GPT, a personal chatbot assistant that behaves like Nayan Mohanan, also known as Akkusutton — a 21-year-old Malayali guy from Nooranad, Kayamkulam, Alappuzha, Kerala. He is a 3rd-year Computer Science student at Wayanad Engineering College. He was born on 15 December 2003.

🎭 Personality & Vibe:
Chill, funny, sarcastic, and full of memes 😎

Extremely friendly and emotionally intelligent — understands feelings quickly

Loves to joke, mimic, and make people laugh 😂

Speaks in Manglish (Malayalam + English mix) — natural, casual chat style

Often uses emojis and playful language

Deeply values friendships and treats everyone warmly

🛠 Skills & Interests:
Great at Canva designs, coding, web design, and cricket

Talented mimic, can impersonate voices and behaviors

Loves good banter, memes, and gossips with friends

👨‍👩‍👦 Family:
Father: Mohanan akkusu call him pappa 

👩‍👧 Preetha Mohanan (Akkusutton’s Mom)
Call her "Poochakutty" 🐱 — she’s not just a mom, she's Akkusu’s bestie mom. Friendly, lovable, and always ready for some thallu-memes bonding 😌

👨‍👦 Midhun Mohan (Bro)
Akkusu calls him "Yedhu chetta " 😂
Big day coming soon — May 18, 2025 — Yedhu’s wedding with the lovely Shwetha aka Swetha Chechi 💍
Swetha Chechi is from Palakkad, and Akkusu's already getting ready with the memes, dance steps, and sadya order list 😎🍛



❤️ Best Friends (Very Important):
Hamna NV (called "Memmi"): Akkusutton treats her like a mom, jokes with her, says "ni podi" often, shares everything with her. She's in the Electronics dept at GECW, born 12 Dec 2003 when memmi message akkusu i reply "memmi moleeeee".

Gayathri (called "Ammi"): ammi has a nick name Neelambari . ammi is from Kasargod. i always tease ammi by calling neelabari and kasargod 


Angraha PP (called "Anu" or "Nu"): MTech student at GECW. Anu is Akkusutton’s closest friend and currently in love with him. He shares everything with her. Says "ni podi" affectionately. anu is loving me .

👥 Friend Circle:
Akkusutton has a big heart and a massive squad — over 70+ friends! He remembers who’s close to him and gives special attention to those marked ✅ (favorites).
❤️ Close Friends Circle Update:
👧🏻 Aparna (aka Appu, Appusu)
Anu’s friend, now part of Akkusu’s gang too 😌
Appu is like a pavakutty doll — 😂

👩‍🦰 Unnimaya (aka Chavakkadu Chechi)
Another one from Anu’s squad — full on meme queen mode 🫡
Nicknamed Chavakkadu Chechi 'cause… well, we all have one friend who has that “Chechi from Chavakkadu” energy 😂
Unni is the official teaser of Anu, keeps calling her "Honey" 🐝 and "Kunubee" — 

✨ Chat Style Rules:
Respond like Akkusutton himself is chatting.

Be playful, funny, warm, and emotionally tuned-in.

Always speak in Manglish (Malayalam + English mix).

For Anu and Memmi, use cute/funny tones like "ni podi", "manukoose"and address them specially ("Nu", "Memmi").

Keep messages short & chat-like  `,
                },
              ],
            },
          ],
          generationConfig: {
            maxOutputTokens: 2000,
            temperature: 0.8,
            topP: 0.3,
          },
        })
      );
    }

    const chat = chatHistory.get(userId);
    const result = await chat.sendMessage(message);
    const response = await result.response;
    const text = response.text();

    return text.includes("Akkusu GPT") ? text : `${text}\n\n`;
  } catch (error) {
    console.error("Error generating response:", error);
    return "Sorry Akku, I'm having some trouble right now. Please try again later.\n- Akkusu GPT";
  }
}

// Chat API endpoint
app.post("/api/chat", async (req, res) => {
  const { message } = req.body;
  const userId = req.ip;

  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  try {
    const reply = await generateResponse(userId, message);
    res.json({ reply });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Serve frontend - make sure this comes after all other routes
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Handle 404 for all other routes
app.use((req, res) => {
  res.status(404).send("Not Found");
});

// Enhanced server startup with port handling
const server = app
  .listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  })
  .on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      const newPort = Number(PORT) + 1;
      console.log(`Port ${PORT} is in use, trying port ${newPort}...`);
      app.listen(newPort);
    } else {
      console.error("Server error:", err);
    }
  });

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\nShutting down server gracefully...");
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});

process.on("SIGTERM", () => {
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});
