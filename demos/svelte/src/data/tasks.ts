export interface Task {
  id: number;
  title: string;
  description: string;
  duration: number;
  percentComplete: number;
  start: string;
  finish: string;
  effortDriven: boolean;
  prerequisites: number[];
  countryOfOriginName: string;
  cityOfOrigin: string;
}

export function createTasks(count: number, offset = 0): Task[] {
  return Array.from({ length: count }, (_, index) => {
    const id = index + offset;
    return {
      id,
      title: `Task ${id}`,
      description: `Description for task ${id}`,
      duration: (id * 7) % 100,
      percentComplete: (id * 13) % 101,
      start: `${2000 + (id % 10)}-01-15`,
      finish: `${2001 + (id % 10)}-02-15`,
      effortDriven: id % 5 === 0,
      prerequisites: id > 0 && id % 2 === 0 ? [id - 1] : [],
      countryOfOriginName: id % 2 ? 'Canada' : 'United States',
      cityOfOrigin: id % 2 ? 'Vancouver' : 'Boston',
    };
  });
}
