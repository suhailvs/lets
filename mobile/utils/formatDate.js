export function formatDate(date, options = {}) {
  try {
    if (!date) return "";
    const parsedDate = typeof date === 'string' ? new Date(date) : date;

    if (isNaN(parsedDate)) return 'Invalid date';

    const defaultOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    };

    return new Intl.DateTimeFormat('en-US', {
      ...defaultOptions,
      ...options,
    }).format(parsedDate);
  } catch (err) {
    console.error('formatDate error:', err);
    return 'Invalid date';
  }
}

// const formatDate = (dateString) => {    
//   const date = new Date(dateString);    
//   return new Intl.DateTimeFormat("en-US", {
//     year: "numeric",
//     month: "long",
//     day: "2-digit",
//   }).format(date);
// };
  