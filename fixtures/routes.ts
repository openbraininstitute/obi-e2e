/** Application paths, built from the lab and project under test. */
export const routes = {
  data: (labId: string, projectId: string) => `/app/virtual-lab/${labId}/${projectId}/data`,

  dataEntity: (labId: string, projectId: string, slug: string) =>
    `/app/virtual-lab/${labId}/${projectId}/data/browse/entity/${slug}`,
};
