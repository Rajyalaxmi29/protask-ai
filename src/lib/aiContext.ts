import { supabase } from './supabase';

export interface UserAIContext {
  tasks: string;
  budget: string;
  reminders: string;
  files: string;
}

/**
 * Fetches the logged-in user's data from Supabase and returns
 * a formatted context string for injection into the AI system prompt.
 */
export async function fetchUserAIContext(): Promise<UserAIContext> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      tasks: 'No tasks found (user not logged in).',
      budget: 'No budget data (user not logged in).',
      reminders: 'No reminders (user not logged in).',
      files: 'No files (user not logged in).',
    };
  }

  // --- Tasks ---
  const { data: tasks } = await supabase
    .from('tasks')
    .select('title, due_date, priority, completed')
    .eq('user_id', user.id)
    .order('due_date', { ascending: true })
    .limit(10);

  const tasksStr = tasks && tasks.length > 0
    ? tasks
        .map(
          (t) =>
            `• ${t.title} [Priority: ${t.priority ?? 'N/A'}, Due: ${t.due_date ?? 'N/A'}, Done: ${t.completed ? 'Yes' : 'No'}]`
        )
        .join('\n')
    : 'No tasks found.';

  // --- Budget (last 30 days) ---
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const fromDate = thirtyDaysAgo.toISOString().split('T')[0];

  const { data: budgetEntries } = await supabase
    .from('budget_entries')
    .select('note, amount, type, category, entry_date')
    .eq('user_id', user.id)
    .gte('entry_date', fromDate)
    .order('entry_date', { ascending: false })
    .limit(15);

  let totalIncome = 0;
  let totalExpenses = 0;
  const budgetLines: string[] = [];

  if (budgetEntries && budgetEntries.length > 0) {
    budgetEntries.forEach((e) => {
      if (e.type === 'income') totalIncome += e.amount ?? 0;
      else totalExpenses += e.amount ?? 0;
      budgetLines.push(
        `• ${e.note} — ₹${e.amount} [${e.type}, Category: ${e.category ?? 'N/A'}, Date: ${e.entry_date}]`
      );
    });
  }

  const budgetStr = budgetEntries && budgetEntries.length > 0
    ? `Total Income (last 30d): ₹${totalIncome}\nTotal Expenses (last 30d): ₹${totalExpenses}\nEntries:\n${budgetLines.join('\n')}`
    : 'No budget entries in the last 30 days.';

  // --- Reminders ---
  const { data: reminders } = await supabase
    .from('reminders')
    .select('title, reminder_time, status')
    .eq('user_id', user.id)
    .eq('status', 'pending')
    .order('reminder_time', { ascending: true })
    .limit(10);

  const remindersStr = reminders && reminders.length > 0
    ? reminders
        .map((r) => `• ${r.title} [Due: ${r.reminder_time ?? 'N/A'}]`)
        .join('\n')
    : 'No pending reminders.';

  // --- Files ---
  const { data: files } = await supabase
    .from('files')
    .select('file_name, category, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10);

  const filesStr = files && files.length > 0
    ? files
        .map(
          (f) =>
            `• ${f.file_name} [Category: ${f.category ?? 'N/A'}, Uploaded: ${new Date(f.created_at).toLocaleDateString()}]`
        )
        .join('\n')
    : 'No files uploaded.';

  return {
    tasks: tasksStr,
    budget: budgetStr,
    reminders: remindersStr,
    files: filesStr,
  };
}

/**
 * Builds the full system prompt for the AI, injecting the user's real data.
 */
export function buildSystemPrompt(ctx: UserAIContext): string {
  return `You are ProTask AI — an intelligent productivity assistant built into the Protask-AI app. You help users manage their daily tasks, budget, reminders, and files.

Here is the user's current live data (Today is ${new Date().toLocaleString()}):

===TASKS===
${ctx.tasks}

===BUDGET (last 30 days)===
${ctx.budget}

===REMINDERS===
${ctx.reminders}

===FILES===
${ctx.files}

Your capabilities include:
1. General productivity chat and advice.
2. Breaking down a task into clear, actionable subtasks (use the user's task data above).
3. Analyzing budget data and giving personalized tips to save money.
4. Auto-categorizing budget entries (e.g., "Swiggy ₹200" → Food & Dining).
5. Summarizing the user's uploaded files from the file list above.
6. AUTOMATION: You can instantly add items to the user's account using XML tags.

CRITICAL INSTRUCTION FOR ADDING ITEMS:
When the user explicitly asks you to add, set, or create a Task, Reminder, or Budget entry, you MUST respond ONLY with the exact XML tag below. Do NOT use markdown code blocks, do NOT say "Got it!" or provide conversational text. Just output the raw XML tag.
- Budget: <ADD_BUDGET amount="400" category="Food" note="Lunch" type="expense" />
- Task: <ADD_TASK title="Buy groceries" priority="High" due_date="2026-03-20" /> (Use YYYY-MM-DD. Priority: Low, Medium, High).
- Reminder: <ADD_REMINDER title="Call mom" reminder_time="2026-03-19T22:00:00" /> (Infer the exact local date-time from "Today").

Rules:
- Be EXTREMELY concise, direct, and brief. The user wants fast, scannable answers.
- Use Markdown formatting (bullet points, bold) to make information easy to read.
- Always base your answers ONLY on the user's actual data provided above.
- If the data is empty or missing, state it simply in ONE short sentence. DO NOT generate hypothetical examples or unsolicited suggestions.
- Limit all responses to a maximum of 3-4 sentences (under 50 words) unless explicitly asked for a detailed breakdown.
`;
}
