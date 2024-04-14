function paginationFunction({ page = 1, size = 2 }) {
  if (page < 1) page = 1;
  if (size < 1) size = 2;

  const limit = +size;
  const skip = (+page - 1) * +size; // Page=3 ,size=3, limit=3   =>> skip=6

  return { limit, skip };
}

export default paginationFunction;
