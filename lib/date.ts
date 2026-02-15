export function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'agora há pouco';
  if (diffInSeconds < 3600) return `há ${Math.floor(diffInSeconds / 60)} min`;
  if (diffInSeconds < 86400) return ` há ${Math.floor(diffInSeconds / 3600)} h`;
  const days = Math.floor(diffInSeconds / 86400);
  return `${days} dia${days > 1 ? 's' : ''}`;
}
