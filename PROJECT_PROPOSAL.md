# Project Proposal: Mise

## One-Line Description
Mise (maybe Sous, still haven't decided on the name) is a mobile cooking companion that keeps your recipes, technique know-how, and an AI sous chef all in one place — so you never have to leave the kitchen to Google something.

## The Problem
When you're cooking from a recipe, you constantly have to leave the recipe to look things up: "What does 'deglaze' mean?" "Can I substitute this ingredient?" "How do I know when the onions are ready?" You end up juggling YouTube, Google, and recipe blogs with messy hands. Mise solves this by putting everything you need — recipes, technique explanations, and a conversational AI assistant — in a single app you can use right from your kitchen.

## Target User
Home cooks who follow recipes but are still building their technique vocabulary — the kind of person who knows what they want to cook but occasionally hits a wall on *how* to do a specific step. Especially college students and young adults who are getting more serious about cooking.

## Core Features (v1)
1. **Add and view personal recipes** — Users can add their own recipes with ingredients and step-by-step instructions
2. **Interactive technique terms** — Cooking terms in recipe instructions (e.g., "julienne," "fold," "braise") are tappable and show a short explanation powered by AI
3. **AI cooking assistant** — A chat interface where you can ask questions while cooking ("Can I use olive oil instead of butter?", "My sauce is too thin, what do I do?")
4. **Recipe discovery** — Browse and search recommended recipes by cuisine or ingredient via the Spoonacular API
5. **Grocery list generation** — Tap a recipe to auto-generate a shopping list from its ingredients

## Tech Stack
- **Frontend:** React Native with Expo (leverages existing React knowledge, builds a native iOS experience)
- **Styling:** NativeWind (Tailwind CSS for React Native)
- **Database:** Supabase (stores user recipes, saved grocery lists, and favorites)
- **Auth:** Supabase Auth (simple email/password or social login for syncing data across devices)
- **APIs:**
  - Claude API (powers the AI cooking assistant and technique explanations)
  - Spoonacular API (recipe discovery, search by ingredient/cuisine, recipe details)
- **Deployment:** Expo Go for development, TestFlight for iOS beta testing
- **MCP Servers:** Supabase MCP (for database management during development)

## Stretch Goals
- **Voice mode** — Ask the AI questions hands-free while cooking ("Hey Mise, what temperature should the oil be?")
- **Recipe import** — Paste a URL from a recipe blog and have AI extract the recipe into a clean format
- **Meal planning** — Plan your week's meals and generate a combined grocery list
- **Step-by-step cook mode** — A focused view that shows one instruction step at a time with large text (easy to read from across the kitchen)
- **Photo journal** — Snap a photo of your finished dish and save it with the recipe
- **Smart substitutions** — AI suggests ingredient substitutions based on dietary restrictions or what you have on hand

## Biggest Risk
The AI integration is the part with the most unknowns — making sure the Claude API responses are fast enough for real-time cooking questions, keeping costs manageable, and making the technique explanations concise and actually helpful (not generic). Prompt engineering will be key to getting the AI to respond like a knowledgeable sous chef rather than a textbook.

A secondary risk is scope creep — a cooking app can expand in a hundred directions. Staying focused on the core loop (view recipe, understand techniques, ask questions) will be critical in the first couple weeks.

## Week 5 Goal
A working iOS app (running on Expo Go) where I can:
- Add a recipe with ingredients and instructions
- View the recipe and tap on cooking terms to see AI-powered explanations
- Open a chat with the AI assistant and ask a cooking question
- Browse recommended recipes from Spoonacular

This proves the core idea: recipes + technique help + AI assistant, all in one place.
