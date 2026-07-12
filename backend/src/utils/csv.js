import { Parser } from 'json2csv';

export function convertToCSV(data, fields) {
  if (!data || data.length === 0) {
    throw new Error('No data available to export');
  }
  const parser = new Parser(fields ? { fields } : {});
  return parser.parse(data);
}

export function sendCSV(res, filename, csvData) {
  res.header('Content-Type', 'text/csv');
  res.attachment(filename);
  return res.send(csvData);
}
