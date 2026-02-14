interface ExportTask {
  title: string;
  description: string;
  status: string;
  priority: string;
  assignee?: string;
  dueDate?: string;
  labels?: string[];
  comments?: number;
  timeSpent?: number;
}

interface ExportData {
  projectName: string;
  exportDate: string;
  totalTasks: number;
  completedTasks: number;
  tasks: ExportTask[];
  teamMembers?: Array<{ name: string; email: string }>;
}

/**
 * Convert tasks to CSV format
 */
export const tasksToCSV = (data: ExportData): string => {
  const headers = [
    'Title',
    'Description',
    'Status',
    'Priority',
    'Assigned To',
    'Due Date',
    'Labels',
    'Comments',
    'Time Spent (minutes)'
  ];

  const rows = data.tasks.map((task) => [
    `"${task.title}"`,
    `"${task.description || ''}"`,
    task.status,
    task.priority,
    task.assignee || 'Unassigned',
    task.dueDate || '',
    `"${task.labels?.join(', ') || ''}"`,
    task.comments || 0,
    task.timeSpent || 0
  ]);

  const csvContent = [
    [`Project: ${data.projectName}`],
    [`Export Date: ${data.exportDate}`],
    [`Total Tasks: ${data.totalTasks}, Completed: ${data.completedTasks}`],
    [],
    headers,
    ...rows
  ]
    .map((row) => row.join(','))
    .join('\n');

  return csvContent;
};

/**
 * Export data to CSV file
 */
export const exportToCSV = (data: ExportData): void => {
  const csv = tasksToCSV(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `${data.projectName}-export-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Generate a simple PDF-like text format that can be printed
 */
export const exportToPDF = (data: ExportData): void => {
  let content = '';

  // Header
  content += `\n${'='.repeat(80)}\n`;
  content += `PROJECT EXPORT REPORT\n`;
  content += `${'='.repeat(80)}\n\n`;

  // Project Info
  content += `Project Name: ${data.projectName}\n`;
  content += `Export Date: ${data.exportDate}\n`;
  content += `Total Tasks: ${data.totalTasks}\n`;
  content += `Completed Tasks: ${data.completedTasks}\n`;
  content += `Completion Rate: ${Math.round((data.completedTasks / data.totalTasks) * 100)}%\n`;

  // Team Members
  if (data.teamMembers && data.teamMembers.length > 0) {
    content += `\n${'='.repeat(80)}\n`;
    content += `TEAM MEMBERS\n`;
    content += `${'='.repeat(80)}\n\n`;
    data.teamMembers.forEach((member) => {
      content += `• ${member.name} (${member.email})\n`;
    });
  }

  // Tasks
  content += `\n${'='.repeat(80)}\n`;
  content += `TASKS\n`;
  content += `${'='.repeat(80)}\n\n`;

  data.tasks.forEach((task, index) => {
    content += `${index + 1}. ${task.title}\n`;
    if (task.description) content += `   Description: ${task.description}\n`;
    content += `   Status: ${task.status} | Priority: ${task.priority}\n`;
    if (task.assignee) content += `   Assigned To: ${task.assignee}\n`;
    if (task.dueDate) content += `   Due Date: ${task.dueDate}\n`;
    if (task.labels && task.labels.length > 0) content += `   Labels: ${task.labels.join(', ')}\n`;
    if (task.comments) content += `   Comments: ${task.comments}\n`;
    if (task.timeSpent) content += `   Time Spent: ${task.timeSpent} minutes\n`;
    content += '\n';
  });

  // Generate PDF using a simple approach
  // In production, you'd use a library like pdfkit or jsPDF
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `${data.projectName}-export-${new Date().toISOString().split('T')[0]}.txt`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Export as JSON for backup/import purposes
 */
export const exportToJSON = (data: ExportData): void => {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `${data.projectName}-export-${new Date().toISOString().split('T')[0]}.json`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
