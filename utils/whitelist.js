// List of protected users who cannot be muted, banned, or warned
const WHITELISTED_USER_IDS = [
  '1040033176980045934', 
  '1059596845875204166',
  '1277231201190674495',
  '1337666564178051112',
  '618159240221294622',
  '774014188288868423',
  '467715745669971978',
  '888640419842392084',
];

module.exports = function isWhitelisted(userId) {
  return WHITELISTED_USER_IDS.includes(userId);
};