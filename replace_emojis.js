const fs = require('fs');
const path = require('path');

const map = {
  '📷': '<span className="material-symbols-rounded inline-block align-middle text-[1em]">photo_camera</span>',
  '🎥': '<span className="material-symbols-rounded inline-block align-middle text-[1em]">videocam</span>',
  '⏹': '<span className="material-symbols-rounded inline-block align-middle text-[1em]">stop_circle</span>',
  '⚠️': '<span className="material-symbols-rounded inline-block align-middle text-[1em]">warning</span>',
  '✅': '<span className="material-symbols-rounded inline-block align-middle text-[1em]">check_circle</span>',
  '❌': '<span className="material-symbols-rounded inline-block align-middle text-[1em]">cancel</span>',
  '⏳': '<span className="material-symbols-rounded inline-block align-middle text-[1em]">hourglass_empty</span>',
  '💰': '<span className="material-symbols-rounded inline-block align-middle text-[1em]">payments</span>',
  '🎟': '<span className="material-symbols-rounded inline-block align-middle text-[1em]">confirmation_number</span>',
  '🎯': '<span className="material-symbols-rounded inline-block align-middle text-[1em]">gps_fixed</span>',
  '📋': '<span className="material-symbols-rounded inline-block align-middle text-[1em]">content_paste</span>',
  '👥': '<span className="material-symbols-rounded inline-block align-middle text-[1em]">group</span>',
  '👤': '<span className="material-symbols-rounded inline-block align-middle text-[1em]">person</span>',
  '🕒': '<span className="material-symbols-rounded inline-block align-middle text-[1em]">schedule</span>',
  '📞': '<span className="material-symbols-rounded inline-block align-middle text-[1em]">call</span>',
  '🔍': '<span className="material-symbols-rounded inline-block align-middle text-[1em]">search</span>'
};

function replaceEmojis(content) {
  let modified = content;
  for (const [emoji, replacement] of Object.entries(map)) {
    // Escape emoji if needed, but simple split/join works
    modified = modified.split(emoji).join(replacement);
  }
  return modified;
}

const filesToProcess = [
  'src/app/admin/AdminRegistrations.tsx',
  'src/app/admin/AdminMedia.tsx',
  'src/app/admin/AdminAccounts.tsx',
  'src/app/admin/AdminApp.tsx',
  'src/components/AdminCameraScanner.tsx'
];

filesToProcess.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    const newContent = replaceEmojis(content);
    if (newContent !== content) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log('Replaced emojis in', file);
    }
  }
});
