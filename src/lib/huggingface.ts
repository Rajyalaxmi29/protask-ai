export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Local Rule-Based Bot (No API Required)
 * Parses the system prompt (which contains the user's Supabase data) and replies directly.
 */
export async function callHuggingFace(
  systemPrompt: string,
  messages: ChatMessage[]
): Promise<string> {
  // Simulate network delay for realism
  await new Promise(resolve => setTimeout(resolve, 800));

  const lastUserMsg = messages.filter(m => m.role === 'user').pop()?.content.toLowerCase() || '';

  // ── 1. Quick Action: Task Breakdown ──
  if (lastUserMsg.includes('break down my most urgent incomplete task')) {
    return "Here is a breakdown of your next steps:\n\n• **Step 1:** Review the requirements.\n• **Step 2:** Gather necessary materials.\n• **Step 3:** Execute the main work.\n• **Step 4:** Review and mark as complete.";
  }
  
  // ── 2. Quick Action: Budget Tips ──
  if (lastUserMsg.includes('analyze my recent budget entries and give me 3 personalized tips')) {
    return "Based on your recent spending, here are 3 tips:\n\n1. **Track small expenses:** Many small purchases add up quickly.\n2. **Set category limits:** Keep an eye on frequent food and shopping expenses.\n3. **Review subscriptions:** Make sure you're using everything you pay for.";
  }
  
  // ── 3. Quick Action: Categorize Expense ──
  if (lastUserMsg.includes('i want to categorize an expense')) {
    return "Sure! Tell me what you bought and how much it cost (e.g., 'I spent 450 on Swiggy'), and I can add it to your budget for you.";
  }

  // ── 4. Quick Action: Summarize Files ──
  if (lastUserMsg.includes('summarize my files')) {
    const filesChunk = systemPrompt.split('===FILES===')[1]?.split('===')[0] || '';
    if (filesChunk.includes('No files')) return "You don't have any files uploaded yet.";
    return `You have several files uploaded recently:\n${filesChunk.trim()}\n\nI recommend grouping them by project to stay organized!`;
  }

  // ── 5. Quick Action: Productivity ──
  if (lastUserMsg.includes('productivity tips for today')) {
    return "Here are 3 tips for today:\n1. **Eat the frog:** Do your highest priority task first.\n2. **Timebox:** Work in 25-minute Pomodoro sprints.\n3. **Clear your desk:** A tidy workspace helps focus.";
  }

  // ── Add Item Parsing (Simulated Automation) ──
  if (lastUserMsg.includes('spent') || lastUserMsg.includes('bought') || lastUserMsg.includes('paid')) {
    // very basic number extraction
    const match = lastUserMsg.match(/\d+/);
    if (match) {
      const amount = match[0];
      return `<ADD_BUDGET amount="${amount}" category="Other" note="Expense from chat" type="expense" />`;
    }
  }

  if (lastUserMsg.includes('add task') || lastUserMsg.includes('remind me to')) {
    const title = lastUserMsg.replace('add task', '').replace('remind me to', '').trim();
    if (title) {
      return `<ADD_TASK title="${title}" priority="Medium" due_date="" />`;
    }
  }

  // ── General Queries ──
  if (lastUserMsg.includes('task') || lastUserMsg.includes('todo')) {
     const tasksChunk = systemPrompt.split('===TASKS===')[1]?.split('===')[0] || '';
     return `Here are your current tasks:\n\n${tasksChunk.trim()}`;
  }

  if (lastUserMsg.includes('budget') || lastUserMsg.includes('spend') || lastUserMsg.includes('expense') || lastUserMsg.includes('money')) {
     const budgetChunk = systemPrompt.split('===BUDGET (last 30 days)===')[1]?.split('===')[0] || '';
     return `Here is your recent budget activity:\n\n${budgetChunk.trim()}`;
  }

  if (lastUserMsg.includes('reminder')) {
    const remChunk = systemPrompt.split('===REMINDERS===')[1]?.split('===')[0] || '';
    return `Here are your reminders:\n\n${remChunk.trim()}`;
  }

  if (lastUserMsg.includes('hi') || lastUserMsg.includes('hello')) {
    return "Hello! I'm running in offline/local mode. You don't need an API key to use me! I can read your Tasks, Budget, and Reminders, or add new ones for you.";
  }

  // Fallback
  return "I'm running in local rule-based mode without an API key! Ask me about your tasks, budget, reminders, or use the quick action buttons below.";
}
