'use client'

import { useState } from 'react'
import { Input, Textarea } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Copy, Check, Terminal } from 'lucide-react'

export function DocsPromptBox() {
  const [title, setTitle] = useState('')
  const [shortDescription, setShortDescription] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [techStack, setTechStack] = useState('HTML5 Canvas & JavaScript')
  const [concept, setConcept] = useState('')
  const [copied, setCopied] = useState(false)
  const [agent, setAgent] = useState('Generic')

  let intro = 'You are an expert HTML5 game developer.'
  if (agent === 'Claude Code') intro = 'You are Claude Code, an expert HTML5 game developer.'
  if (agent === 'Antigravity') intro = 'You are Antigravity, an advanced agentic coding assistant and expert HTML5 game developer.'
  if (agent === 'Cursor') intro = 'You are Cursor, an expert AI programming assistant and HTML5 game developer.'
  if (agent === 'GitHub Copilot') intro = 'You are GitHub Copilot, an expert AI programming assistant and HTML5 game developer.'
  if (agent === 'ChatGPT') intro = 'You are ChatGPT, an expert HTML5 game developer.'
  if (agent === 'Gemini') intro = 'You are Gemini, an expert HTML5 game developer.'
  if (agent === 'Devin') intro = 'You are Devin, an autonomous AI software engineer and expert HTML5 game developer.'

  const generatedPrompt = `${intro} I want you to build a single-file or structure-complete HTML5 game for me.

Here are the details of the game I want to build:
- **Game Title**: ${title || '[Specify Game Title, e.g., Flappy Bird]'}
- **Tech Stack**: ${techStack || '[Specify Tech Stack, e.g., Canvas & Vanilla JS]'}
- **Game Concept & Vision**: ${concept || '[Describe your game idea and how it should play]'}

### Critical Requirement: Boofer SDK Integration
You MUST integrate the Boofer SDK into this game. Follow these guidelines exactly to ensure the game works properly inside the Boofer platform.

1. **Include the CDN Script**:
   Add this inside the game's \`<head>\` tag:
   \`\`\`html
   <script src="https://booferapp.github.io/bgames/assets/sdk/boofer-sdk.js"></script>
   \`\`\`

2. **Configure SEO, API Key & Dev Environment**:
   Include these tags in the \`<head>\`:
   \`\`\`html
   <title>${title || '[Specify Game Title, e.g., Flappy Bird]'}</title>
   <meta name="description" content="${shortDescription || '[Specify Game Short Description for SEO]'}">
   <meta name="boofer-api-key" content="${apiKey || 'YOUR_API_KEY'}">
   <!-- Environment tag (for development, must be removed before production) -->
   <meta name="boofer-env" content="development">
   \`\`\`

3. **CSS Styling (Tailwind or Custom)**:
   - Please include Tailwind CSS via CDN in the \`<head>\` for styling: \`<script src="https://cdn.tailwindcss.com"></script>\`
   - Alternatively, write clean, minimalistic custom CSS. Make the UI modern, responsive, and polished.

4. **SDK Initialization & Safe Fallback**:
   Initialize communication with the parent shell immediately upon game startup. Implement a fallback for testing outside the Boofer shell.
   \`\`\`javascript
   let playerContext = null;
   let isBooferActive = false;

   (async () => {
     try {
       // Wait for native bridge (timeout defaults to 6s)
       await Boofer.ready(6000);
       
       // Initialize game session and extract context
       const config = await Boofer.initGame({ 
         gameId: 'your_game_id', 
         gameVersion: '1.0.0' 
       });
       
       playerContext = config.player;
       isBooferActive = true;
       console.log("Welcome back,", playerContext.displayName);
       
       // Start game loop with actual player details
       startGame(playerContext);
     } catch (err) {
       console.warn("Running outside Boofer shell:", err.message);
       // Fallback context for local browser testing / development
       playerContext = {
         userId: 'guest_user_123',
         displayName: 'Guest Player',
         avatarUrl: 'https://placehold.co/150',
         level: 1,
         highScore: 0
       };
       startGame(playerContext);
     }
   })();
   \`\`\`

4. **Required Game UI - Profile Button**:
   - The game UI MUST have a clearly visible "Profile" button.
   - When clicked, this button must call \`await Boofer.getPlayerInfo(true)\` (to fetch the latest level/high score details) and display the player details (avatarUrl, displayName, level, highScore) in a styled overlay or modal.
   - The game loop and audio should be paused while the profile overlay/modal is open, and resumed when closed.

5. **Lifecycle Event Listeners**:
   Subscribe to application state notifications from the host shell:
   \`\`\`javascript
   Boofer.onAppEvent('pause', () => {
     // Pause game loop, sounds, and active gameplay
   });

   Boofer.onAppEvent('resume', () => {
     // Resume game loop, sounds, and active gameplay
   });
   \`\`\`

6. **Monetization (Rewarded Videos)**:
   Add support for rewarded video ads. For example, if the player loses their lives, you can offer them a rewarded ad:
   \`\`\`javascript
   // Listen to rewarded events
   Boofer.onRewardEarned(({ type, amount }) => {
     if (type === 'extra_life') {
       playerLives += amount;
       resumeGame();
     }
   });
   \`\`\`

7. **Scores, High Scores & Leaderboards**:
   - Save scores when completing levels or matching new milestones:
     \`\`\`javascript
     await Boofer.saveScore(currentScore);
     \`\`\`
   - When the game is over (Game Over):
     - Trigger haptic error feedback: \`await Boofer.triggerHaptic('error');\`
     - Submit final score and trigger native post-match leaderboard display:
       \`\`\`javascript
       await Boofer.gameOver(finalScore, { reason: 'lives_depleted' });
       \`\`\`
   - In the main menu / game over screen, add buttons to:
     - View leaderboard: \`Boofer.showLeaderboard();\`
     - Share score: \`await Boofer.shareScore(finalScore, "I just scored " + finalScore + "!");\`

8. **Gameplay Haptic Feedback & Telemetry**:
   - Trigger haptic feedback for key interactions:
     - Small actions (jumping, shooting, collection): \`await Boofer.triggerHaptic('light');\` or \`'medium'\`
     - Milestone/Success (level complete, high score): \`await Boofer.triggerHaptic('success');\`
   - Track custom telemetry events:
     \`\`\`javascript
     await Boofer.trackEvent('level_failed', { level: currentLevel, finalScore: currentScore });
     \`\`\`

9. **Achievements, Inventory & Backend (If applicable)**:
   - Fetch achievements: \`await Boofer.getAchievements();\`
   - Unlock achievement: \`await Boofer.unlockAchievement('achievement_id', 100);\`
   - Consume inventory item: \`await Boofer.consumeItem('item_id', 1);\`
   - For backend verification, get the Xaor token: \`const { token } = await Boofer.getSessionToken();\`

Please design the game to be modern, responsive, and completely functional within a single HTML/JS bundle.`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedPrompt)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  return (
    <div className="border border-neutral-900 bg-neutral-950 p-6 mb-10">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Terminal size={16} className="text-neutral-400" />
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider">AI Copilot Prompt Generator</h2>
        </div>
        <select
          value={agent}
          onChange={(e) => setAgent(e.target.value)}
          className="bg-neutral-900 border border-neutral-800 text-neutral-300 text-xs px-3 py-1.5 focus:outline-none focus:border-neutral-600 cursor-pointer"
        >
          <option value="Generic">Generic AI</option>
          <option value="Claude Code">Claude Code</option>
          <option value="Antigravity">Antigravity</option>
          <option value="Cursor">Cursor</option>
          <option value="GitHub Copilot">GitHub Copilot</option>
          <option value="ChatGPT">ChatGPT</option>
          <option value="Gemini">Gemini</option>
          <option value="Devin">Devin</option>
        </select>
      </div>
      <p className="text-xs text-neutral-500 mb-6 leading-relaxed">
        Don&apos;t want to write the SDK code yourself? Fill in your game details to generate a customized prompt. Copy and paste it into your favorite AI developer agent (like Claude, Cursor, or Antigravity) to build a fully integrated HTML5 game.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
        {/* Form Inputs */}
        <div className="space-y-4">
          <Input
            label="Game Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Space Raiders"
          />
          <Input
            label="Short Description (SEO)"
            value={shortDescription}
            onChange={(e) => setShortDescription(e.target.value)}
            placeholder="e.g., A classic 2D space shooter"
          />
          <Input
            label="API Key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="e.g., bf_123456..."
          />
          <Input
            label="Tech Stack"
            value={techStack}
            onChange={(e) => setTechStack(e.target.value)}
            placeholder="e.g., HTML5 Canvas & JavaScript"
          />
          <Textarea
            label="Describe your game idea / vision"
            value={concept}
            onChange={(e) => setConcept(e.target.value)}
            placeholder="Describe the gameplay mechanics, visual style, how score is earned, etc..."
            rows={4}
          />
        </div>

        {/* Prompt Preview & Copy */}
        <div className="flex flex-col h-[400px] md:h-full md:absolute md:right-0 md:top-0 md:w-[calc(50%-12px)]">
          <div className="flex justify-between items-center mb-1.5 shrink-0">
            <span className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Generated System Prompt</span>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleCopy}
              className="flex items-center gap-1.5 py-1 px-2.5 text-xs text-neutral-400 hover:text-white border border-neutral-800 hover:border-neutral-700 bg-neutral-950 transition-colors -my-1"
            >
              {copied ? (
                <>
                  <Check size={12} className="text-green-500" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy size={12} />
                  <span>Copy Prompt</span>
                </>
              )}
            </Button>
          </div>
          <div className="flex-1 min-h-0 bg-[#050505] border border-neutral-900 p-4 font-mono text-xs text-neutral-400 overflow-y-auto whitespace-pre-wrap select-all">
            {generatedPrompt}
          </div>
        </div>
      </div>

      {copied && (
        <div className="fixed bottom-6 right-6 bg-neutral-900 border border-neutral-800 text-white px-4 py-2.5 shadow-xl z-50 flex items-center gap-2 rounded-md">
          <Check size={16} className="text-green-500" />
          <span className="text-sm font-medium">Prompt copied!</span>
        </div>
      )}
    </div>
  )
}
