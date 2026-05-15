import React from 'react';

const normalizeAnswerText = (text) =>
  text
    .replace(/\r/g, '')
    .replace(/\s+(\d+\.\s+\*\*)/g, '\n$1')
    .replace(/\s+(\d+\.\s+[A-Z])/g, '\n$1')
    .trim();

const renderInlineText = (text) => {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).filter(Boolean);

  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={`${part}-${index}`} className="font-bold text-inherit">
          {part.slice(2, -2)}
        </strong>
      );
    }

    if (part.startsWith('*') && part.endsWith('*')) {
      return (
        <em key={`${part}-${index}`} className="not-italic font-medium text-inherit">
          {part.slice(1, -1)}
        </em>
      );
    }

    return <React.Fragment key={`${part}-${index}`}>{part}</React.Fragment>;
  });
};

const isTableRow = (line) => line.includes('|') && line.split('|').filter(Boolean).length >= 2;
const isTableDivider = (line) => /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line);

export default function FormattedMessage({ text, isUser }) {
  if (isUser) return text;

  const lines = normalizeAnswerText(text).split('\n');
  const blocks = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index].trim();

    if (!line) {
      index += 1;
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      const items = [];
      while (index < lines.length && /^\d+\.\s+/.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(/^\d+\.\s+/, ''));
        index += 1;
      }
      blocks.push({ type: 'numbered-list', items });
      continue;
    }

    if (/^[-*]\s+/.test(line)) {
      const items = [];
      while (index < lines.length && /^[-*]\s+/.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(/^[-*]\s+/, ''));
        index += 1;
      }
      blocks.push({ type: 'bullet-list', items });
      continue;
    }

    if (isTableRow(line)) {
      const rows = [];
      while (index < lines.length && isTableRow(lines[index].trim())) {
        const currentLine = lines[index].trim();
        if (!isTableDivider(currentLine)) {
          rows.push(currentLine.split('|').map((cell) => cell.trim()).filter(Boolean));
        }
        index += 1;
      }
      blocks.push({ type: 'table', rows });
      continue;
    }

    const paragraphs = [line];
    index += 1;
    while (
      index < lines.length &&
      lines[index].trim() &&
      !/^\d+\.\s+/.test(lines[index].trim()) &&
      !/^[-*]\s+/.test(lines[index].trim()) &&
      !isTableRow(lines[index].trim())
    ) {
      paragraphs.push(lines[index].trim());
      index += 1;
    }
    blocks.push({ type: 'paragraph', text: paragraphs.join(' ') });
  }

  return (
    <div className="chat-answer space-y-3">
      {blocks.map((block, blockIndex) => {
        if (block.type === 'numbered-list') {
          return (
            <ol key={`numbered-${blockIndex}`} className="space-y-2 pl-5 list-decimal">
              {block.items.map((item, itemIndex) => (
                <li key={`${item}-${itemIndex}`} className="pl-1">
                  {renderInlineText(item)}
                </li>
              ))}
            </ol>
          );
        }

        if (block.type === 'bullet-list') {
          return (
            <ul key={`bullet-${blockIndex}`} className="space-y-2 pl-5 list-disc">
              {block.items.map((item, itemIndex) => (
                <li key={`${item}-${itemIndex}`} className="pl-1">
                  {renderInlineText(item)}
                </li>
              ))}
            </ul>
          );
        }

        if (block.type === 'table' && block.rows.length > 0) {
          const [header, ...body] = block.rows;
          return (
            <div key={`table-${blockIndex}`} className="overflow-x-auto rounded-xl border border-white/10">
              <table className="min-w-full border-collapse text-left text-xs">
                <thead className="bg-sky-300/10 text-slate-100">
                  <tr>
                    {header.map((cell, cellIndex) => (
                      <th key={`${cell}-${cellIndex}`} className="border-b border-white/10 px-3 py-2 font-bold">
                        {renderInlineText(cell)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {body.map((row, rowIndex) => (
                    <tr key={`row-${rowIndex}`} className="odd:bg-white/5 even:bg-slate-950/30">
                      {row.map((cell, cellIndex) => (
                        <td key={`${cell}-${cellIndex}`} className="border-b border-white/10 px-3 py-2 align-top">
                          {renderInlineText(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }

        return (
          <p key={`paragraph-${blockIndex}`} className="m-0">
            {renderInlineText(block.text)}
          </p>
        );
      })}
    </div>
  );
}
