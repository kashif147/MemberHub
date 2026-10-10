import { POLICY_SERVICE_URL } from '../constants/config';
import { createAuthedClient } from './createClient';

const policy = createAuthedClient(POLICY_SERVICE_URL);

export const fetchCategoryByTypeId = (id: string) =>
  policy.get(`/products/by-type/${id}`);

export const fetchCategoryByCategoryId = (categoryId: string) =>
  policy.get(`/products/${categoryId}`);
