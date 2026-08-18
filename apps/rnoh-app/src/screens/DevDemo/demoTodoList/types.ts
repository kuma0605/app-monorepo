export type TodoItem = {
  id: string;
  title: string;
  category: string;
  categoryCode: string;
  status: string;
  statusCode: string;
  priority: string;
  priorityCode: string;
  source: string;
  sourceCode: string;
  assignee: string;
  createTime: string;
  deadline: string;
};

export type TodoFilters = {
  keyword?: string;
  category?: string;
  status?: string;
  priority?: string;
  source?: string;
};

export const INITIAL_TODO_FILTERS: TodoFilters = {};

export type TodoFetchParams = {
  pageNumber: number;
  pageSize: number;
  keyword?: string;
  category?: string;
  status?: string;
  priority?: string;
  source?: string;
};
