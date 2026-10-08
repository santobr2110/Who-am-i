import { definePack } from '../define';

export default definePack(
  { id: 'places', name: 'Places', emoji: '🗺️', description: 'Cities, countries and wonders of the world.' },
  [
    ['new-york', 'New York', '🗽', 'A1', 1, 'The biggest city in the USA', ['You are a city.', 'You are in the USA.', 'The Statue of Liberty lives in you.'], ['city', 'usa'], ['new york city', 'nyc', 'ny']],
    ['paris', 'Paris', '🥐', 'A1', 1, 'The capital of France', ['You are a city.', 'You are in Europe.', 'You have the Eiffel Tower.'], ['city', 'europe'], []],
    ['rio-de-janeiro', 'Rio de Janeiro', '🏖️', 'A1', 1, 'Brazilian city famous for beaches and carnival', ['You are a city.', 'You are in Brazil.', 'You have Christ the Redeemer and Copacabana.'], ['city', 'brazil'], ['rio']],
    ['london', 'London', '💂', 'A1', 1, 'The capital of England', ['You are a city.', 'People speak English in you.', 'You have Big Ben and red buses.'], ['city', 'europe'], []],
    ['tokyo', 'Tokyo', '🗼', 'A2', 1, 'The capital of Japan', ['You are a very big city.', 'You are in Asia.', 'You are the capital of Japan.'], ['city', 'asia'], ['tokio']],
    ['the-beach', 'The Beach', '🏝️', 'A1', 1, 'Sand, sea and sun', ['You are a place, not a city.', 'People visit you in summer.', 'You have sand and sea.'], ['nature'], ['beach', 'a beach']],
    ['egypt', 'Egypt', '🐫', 'A2', 2, 'Country of the pyramids', ['You are a country.', 'You are in Africa.', 'You have very old pyramids.'], ['country', 'africa'], []],
    ['amazon-rainforest', 'Amazon Rainforest', '🌳', 'A2', 2, 'The largest rainforest on Earth', ['You are not a city.', 'You are in South America.', 'You are the biggest forest in the world.'], ['nature', 'brazil'], ['amazon', 'the amazon', 'amazon forest', 'amazonia', 'amazon jungle']],
    ['the-moon', 'The Moon', '🌙', 'A2', 2, "Earth's only natural satellite", ['You are not on Earth.', 'People can see you at night.', 'Astronauts walked on you in 1969.'], ['space'], ['moon']],
    ['great-wall', 'Great Wall of China', '🧱', 'B1', 2, 'A very long ancient wall', ['People built you a very long time ago.', 'You are in Asia.', 'You are thousands of kilometres long.'], ['landmark', 'asia'], ['the great wall', 'great wall', 'china wall', 'wall of china']],
    ['sahara', 'Sahara Desert', '🏜️', 'B1', 2, 'The largest hot desert', ['You are very hot during the day.', 'You are in Africa.', 'You are made of sand and almost no rain falls on you.'], ['nature', 'africa'], ['sahara', 'the sahara']],
    ['venice', 'Venice', '🛶', 'B1', 3, 'Italian city built on water', ['You are a city in Europe.', 'You have almost no cars.', 'Your streets are canals and people travel by gondola.'], ['city', 'europe'], ['venezia']],
    ['machu-picchu', 'Machu Picchu', '⛰️', 'B1', 3, 'Ancient Inca city in the mountains of Peru', ['You are very old.', 'You are high in the mountains of South America.', 'The Incas built you in Peru.'], ['landmark', 'south america'], ['machu pichu', 'machupicchu']],
  ],
);
