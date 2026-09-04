/** App URLs the tests open. */

export const routes = {
  data: (labId: string, projectId: string) => `/app/virtual-lab/${labId}/${projectId}/data`,

  dataEntity: (labId: string, projectId: string, slug: string) =>
    `/app/virtual-lab/${labId}/${projectId}/data/browse/entity/${slug}`,

  workflows: (labId: string, projectId: string) =>
    `/app/virtual-lab/${labId}/${projectId}/workflows`,
};
