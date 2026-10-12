const EMPTY_RESULT = {
  products: [],
  doctors: [],
  institutions: [],
  areas: [],
  teamMembers: [],
  orders: []
};

export const searchService = {
  globalSearch: async (query) => {
    if (!query || query.trim().length === 0) return { ...EMPTY_RESULT };
    const res = await window.api.search.global(query.trim().slice(0, 100));
    return res.success && res.data ? res.data : { ...EMPTY_RESULT };
  }
};

export default searchService;
