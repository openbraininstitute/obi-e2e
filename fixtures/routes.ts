/** App URLs the tests open. */

export const routes = {
  data: (labId: string, projectId: string) => `/app/virtual-lab/${labId}/${projectId}/data`,

  /** The Data page, showing every species — `?s=all`, for the reason `dataEntity` gives. */
  dataAllSpecies: (labId: string, projectId: string) =>
    `/app/virtual-lab/${labId}/${projectId}/data?s=all`,

  /**
   * A listing, showing every species.
   *
   * The species picker is a preference the app keeps for the user, not for the
   * tab, so whichever species a parallel test last chose is in force here too,
   * and a listing that holds nothing for it comes up empty. `?s=all` asks this
   * page load for all species, and the URL outranks the stored preference.
   */
  dataEntity: (labId: string, projectId: string, slug: string) =>
    `/app/virtual-lab/${labId}/${projectId}/data/browse/entity/${slug}?s=all`,

  workflows: (labId: string, projectId: string) =>
    `/app/virtual-lab/${labId}/${projectId}/workflows`,
};
