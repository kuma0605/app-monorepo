import type {TodoFetchParams, TodoItem} from './types';

export const MOCK_CATEGORIES = [
  {label: '食品检查', value: 'food'},
  {label: '药品检查', value: 'drug'},
  {label: '特种设备', value: 'special'},
  {label: '知识产权', value: 'ip'},
  {label: '综合执法', value: 'enforce'},
];

export const MOCK_STATUS_OPTIONS = [
  {label: '待处理', value: 'pending'},
  {label: '处理中', value: 'processing'},
  {label: '已完成', value: 'done'},
  {label: '已退回', value: 'rejected'},
];

export const MOCK_PRIORITIES = [
  {label: '全部', value: ''},
  {label: '紧急', value: 'urgent'},
  {label: '重要', value: 'important'},
  {label: '一般', value: 'normal'},
];

export const MOCK_SOURCES = [
  {label: '全部', value: ''},
  {label: '上级指派', value: 'superior'},
  {label: '群众举报', value: 'report'},
  {label: '日常巡查', value: 'patrol'},
  {label: '系统预警', value: 'warning'},
];

export const MOCK_ITEMS: TodoItem[] = Array.from({length: 56}).map((_, i) => ({
  id: String(i + 1),
  title: `待办事项 ${i + 1} — ${
    [
      '食品安全专项检查',
      '药品经营许可核查',
      '特种设备年检提醒',
      '商标侵权投诉处理',
      '价格违法线索跟进',
    ][i % 5]
  }`,
  category: MOCK_CATEGORIES[i % MOCK_CATEGORIES.length].label,
  categoryCode: MOCK_CATEGORIES[i % MOCK_CATEGORIES.length].value,
  status: MOCK_STATUS_OPTIONS[i % MOCK_STATUS_OPTIONS.length].label,
  statusCode: MOCK_STATUS_OPTIONS[i % MOCK_STATUS_OPTIONS.length].value,
  priority: ['紧急', '重要', '一般'][i % 3],
  priorityCode: ['urgent', 'important', 'normal'][i % 3],
  source: MOCK_SOURCES[1 + (i % 4)].label,
  sourceCode: MOCK_SOURCES[1 + (i % 4)].value,
  assignee: `张${['伟', '芳', '强', '敏', '磊'][i % 5]}`,
  createTime: `2026-05-${String(1 + (i % 25)).padStart(2, '0')} ${String(
    8 + (i % 10),
  ).padStart(2, '0')}:${String(i % 60).padStart(2, '0')}`,
  deadline: `2026-06-${String(1 + (i % 28)).padStart(2, '0')}`,
}));

/** 搜索关键词为 __error__ 时可模拟接口失败，便于验证错误态 UI */
export function mockFetchTodoList(params: TodoFetchParams) {
  return new Promise<{
    code: number;
    data: {data: TodoItem[]; total: number};
  }>(resolve => {
    setTimeout(() => {
      if (params.keyword === '__error__') {
        resolve({code: 500, data: {data: [], total: 0}});
        return;
      }

      let filtered = [...MOCK_ITEMS];

      if (params.keyword) {
        const kw = params.keyword.toLowerCase();
        filtered = filtered.filter(
          item =>
            item.title.toLowerCase().includes(kw) ||
            item.assignee.toLowerCase().includes(kw),
        );
      }
      if (params.category) {
        const codes = params.category.split(',');
        filtered = filtered.filter(item => codes.includes(item.categoryCode));
      }
      if (params.status) {
        filtered = filtered.filter(item => item.statusCode === params.status);
      }
      if (params.priority) {
        filtered = filtered.filter(
          item => item.priorityCode === params.priority,
        );
      }
      if (params.source) {
        filtered = filtered.filter(item => item.sourceCode === params.source);
      }

      const total = filtered.length;
      const start = (params.pageNumber - 1) * params.pageSize;
      const data = filtered.slice(start, start + params.pageSize);

      resolve({code: 200, data: {data, total}});
    }, 400);
  });
}

export function findTodoItemById(id: string): TodoItem | undefined {
  return MOCK_ITEMS.find(item => item.id === id);
}
