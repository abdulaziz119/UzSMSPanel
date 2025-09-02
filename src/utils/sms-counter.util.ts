// eslint-disable-next-line @typescript-eslint/no-require-imports
const SmsCounter = require('sms-counter');

export function analyzeSmsContent(text: string) {
  const result = SmsCounter.count(text);
  return {
    encoding: result.encoding, // 'GSM_7BIT' or 'UCS2'
    length: result.length, // total characters in the message
    parts: result.messages, // how many SMS parts will be sent
    perPartLimit: result.per_sms, // max characters per part for this encoding
    remaining: result.remaining, // characters left before the next part
  };
}
