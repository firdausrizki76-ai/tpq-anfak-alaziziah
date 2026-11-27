// Gabungkan materi terpilih + materi ketikan sendiri menjadi satu teks untuk kolom jilid_surat.
export const composeMateri = (selected = [], custom = '') => {
  const extra = String(custom || '').trim();
  return [...selected, ...(extra ? [extra] : [])].join(', ');
};
