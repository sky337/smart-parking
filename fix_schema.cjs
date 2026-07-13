const fs = require('fs');
let content = fs.readFileSync('prisma/schema.prisma', 'utf8');

const enums = [
  'UserRole', 'UserStatus', 'LotStatus', 'SlotType', 'SlotStatus', 'RuleStatus', 
  'TicketStatus', 'PaymentMethod', 'PaymentStatus', 'ReceiptFormat', 'ReceiptStatus', 
  'ReportType', 'ExportFormat', 'ReportStatus', 'BackupStatus', 'LogLevel'
];

enums.forEach(e => {
  const regex = new RegExp(`(\\w+)\\s+${e}(\\??)(\\s+@default\\(([^)]+)\\))?`, 'g');
  content = content.replace(regex, (match, field, optional, defaultBlock, defaultVal) => {
    let replacement = `${field} String${optional}`;
    if (defaultBlock) {
      replacement += ` @default("${defaultVal}")`;
    }
    return replacement;
  });
});

content = content.replace(/^enum\s+\w+\s+\{[\s\S]*?^\}/gm, (match) => {
  return match.split('\n').map(line => '// ' + line).join('\n');
});

fs.writeFileSync('prisma/schema.prisma', content);
