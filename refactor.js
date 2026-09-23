const fs = require('fs');
const path = require('path');

const DIRS = ['src', 'data'];
const EXTENSIONS = ['.ts', '.tsx', '.json', '.css'];

function getFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFiles(file));
    } else {
      if (EXTENSIONS.includes(path.extname(file))) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = [];
DIRS.forEach(dir => {
  if (fs.existsSync(dir)) {
    files.push(...getFiles(dir));
  }
});

let updatedFilesCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;
  
  content = content.replace(/Tickets/g, 'Invitations');
  content = content.replace(/tickets/g, 'invitations');
  content = content.replace(/TICKETS/g, 'INVITATIONS');

  content = content.replace(/Ticket/g, 'Invitation');
  content = content.replace(/ticket/g, 'invitation');
  content = content.replace(/TICKET/g, 'INVITATION');

  // Fix known URLs and casing issues if any
  content = content.replace(/Vé & Giao dịch/g, 'Thư mời & Giao dịch');
  content = content.replace(/Mã vé/g, 'Mã thư mời');
  content = content.replace(/Thẻ vé/g, 'Thẻ thư mời');

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    updatedFilesCount++;
  }
});

console.log(`Replaced content in ${updatedFilesCount} files.`);

const renames = [
  ['src/app/api/admin/receipt/[ticketId]', 'src/app/api/admin/receipt/[invitationId]'],
  ['src/app/api/payment/ticket', 'src/app/api/payment/invitation'],
  ['src/components/DynamicTicketQr.tsx', 'src/components/DynamicInvitationQr.tsx'],
  ['src/lib/ticket-view.ts', 'src/lib/invitation-view.ts'],
  ['data/tickets.json', 'data/invitations.json']
];

renames.forEach(([oldPath, newPath]) => {
  const fullOld = path.join(__dirname, oldPath);
  const fullNew = path.join(__dirname, newPath);
  
  if (fs.existsSync(fullOld)) {
    try {
      if (fs.statSync(fullOld).isDirectory()) {
         fs.mkdirSync(fullNew, { recursive: true });
         const innerFiles = fs.readdirSync(fullOld);
         innerFiles.forEach(f => {
            fs.renameSync(path.join(fullOld, f), path.join(fullNew, f));
         });
         try { fs.rmdirSync(fullOld); } catch(e) {}
      } else {
         fs.renameSync(fullOld, fullNew);
      }
      console.log(`Renamed ${oldPath} to ${newPath}`);
    } catch (e) {
      console.error(`Failed to rename ${oldPath}:`, e.message);
    }
  }
});
