const formatFullAddress = ({ detail, wardName, provinceName }) => {
  const parts = [detail, wardName, provinceName]
    .map((part) => (part || '').trim())
    .filter(Boolean);
  return parts.join(', ');
};

module.exports = { formatFullAddress };
