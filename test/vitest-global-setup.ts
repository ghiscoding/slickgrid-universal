export default async () => {
  // Use a fixed UTC-5 zone instead of the legacy EST alias, which may be absent from tzdata.
  process.env.TZ = 'Etc/GMT+5';
};
