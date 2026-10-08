import { definePack } from '../define';

export default definePack(
  { id: 'objects', name: 'Objects', emoji: '🎒', description: 'Things we use every day.' },
  [
    ['smartphone', 'Smartphone', '📱', 'A1', 1, 'A phone that is also a small computer', ['People use you every day.', 'You fit in a pocket.', 'People use you to call, text and take photos.'], ['technology'], ['phone', 'cell phone', 'mobile phone', 'cellphone', 'mobile', 'iphone']],
    ['bicycle', 'Bicycle', '🚲', 'A1', 1, 'A vehicle with two wheels and pedals', ['People use you outside.', 'You have two wheels.', 'You have pedals and no engine.'], ['transport'], ['bike', 'a bicycle']],
    ['guitar', 'Guitar', '🎸', 'A1', 1, 'A musical instrument with strings', ['You make music.', 'You are made of wood.', 'You have six strings.'], ['music'], ['a guitar']],
    ['camera', 'Camera', '📷', 'A1', 1, 'A device for taking photos', ['People hold you in their hands.', 'Tourists love you.', 'You take photos.'], ['technology'], ['a camera']],
    ['umbrella', 'Umbrella', '☂️', 'A1', 1, 'Keeps you dry in the rain', ['People carry you outside.', 'You open and close.', 'People use you when it rains.'], ['weather'], ['an umbrella']],
    ['book', 'Book', '📖', 'A1', 1, 'Pages full of stories or information', ['You are made of paper.', 'You are in schools and libraries.', 'People read you.'], ['school'], ['a book']],
    ['ball', 'Ball', '⚽', 'A1', 1, 'Round and used in many sports', ['People play with you.', 'You are round.', 'Football players kick you.'], ['sport'], ['a ball', 'football', 'soccer ball']],
    ['clock', 'Clock', '⏰', 'A1', 1, 'Shows the time', ['You are in many houses.', 'You have numbers.', 'You show the time.'], ['home'], ['a clock', 'watch', 'alarm clock']],
    ['backpack', 'Backpack', '🎒', 'A2', 1, 'A bag you carry on your back', ['Students use you every day.', 'You carry things.', 'People wear you on their back.'], ['school'], ['a backpack', 'rucksack', 'schoolbag', 'school bag']],
    ['refrigerator', 'Refrigerator', '🧊', 'A2', 2, 'Keeps food cold', ['You are in the kitchen.', 'You are big and you use electricity.', 'You keep food cold.'], ['home'], ['fridge', 'a fridge', 'a refrigerator']],
    ['headphones', 'Headphones', '🎧', 'A2', 2, 'For listening without disturbing others', ['People wear you.', 'You work with a phone or computer.', 'People use you to listen to music.'], ['technology'], ['earphones', 'earbuds', 'headphone']],
    ['key', 'Key', '🔑', 'A2', 2, 'Opens and locks doors', ['You are small and made of metal.', 'People keep you in their pocket.', 'You open doors.'], ['home'], ['a key', 'keys']],
    ['telescope', 'Telescope', '🔭', 'B1', 3, 'Makes distant objects look closer', ['Scientists use you.', 'People use you at night.', 'You help people see stars and planets.'], ['science'], ['a telescope']],
    ['compass', 'Compass', '🧭', 'B1', 3, 'Shows which way is north', ['Travellers and sailors use you.', 'You have a needle.', 'You always point north.'], ['travel'], ['a compass']],
  ],
);
