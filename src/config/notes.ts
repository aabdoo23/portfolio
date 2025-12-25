/**
 * Notes configuration
 * Simple notes similar to iOS Notes app
 */

export interface Note {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
}

export const notes: readonly Note[] = [
  {
    id: '1',
    title: 'A Little Letter',
    content: 'a little letter I\'m writing in a rush because I love you, a letter because I love you. After all, I love you so much it is getting harder by the day to keep it all to myself and as a consequence, I write to you because I need to give this love a physical form sometimes, something legible and tangible, something you\'d understand when you come across it. It\'ll be a relief to see you after a long wait. I try to remember all the things you say (I want to know you, I want to know you the way you wish to be known). Take care of your heart; mine resides within yours. You can speak for as long as you want, and I promise to listen, I hope you know you can share your bad days with me, too. I will listen even when you don\'t have anything to say; there is enough love that words fail to make themselves useful. I have missed you, I miss you now, and I miss you tomorrow as well. Yours always, Aish <3',
    updatedAt: '2025-12-25T00:00:00Z',
  }
] as const;

