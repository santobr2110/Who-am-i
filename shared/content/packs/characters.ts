import { definePack } from '../define';

export default definePack(
  { id: 'characters', name: 'Characters', emoji: '🦸', description: 'Heroes and villains from films, books and games.', optional: true },
  [
    ['spider-man', 'Spider-Man', '🕷️', 'A1', 1, 'A superhero who climbs walls', ['You are not real.', 'You are a superhero.', 'You wear red and blue and you climb walls.'], ['superhero'], ['spiderman', 'spider man', 'peter parker']],
    ['batman', 'Batman', '🦇', 'A1', 1, 'A superhero who protects Gotham City', ['You are not real.', 'You are a superhero with no superpowers.', 'You wear black and live in Gotham City.'], ['superhero'], ['bat man', 'bruce wayne']],
    ['mickey-mouse', 'Mickey Mouse', '🐭', 'A1', 1, 'The most famous cartoon mouse', ['You are not real.', 'You are an animal in cartoons.', 'You are a mouse with big round ears.'], ['cartoon'], ['mickey']],
    ['elsa', 'Elsa', '❄️', 'A1', 1, 'The ice queen from Frozen', ['You are not real.', 'You are a queen.', 'You can make ice and snow.'], ['film'], ['queen elsa', 'elsa from frozen']],
    ['mario', 'Mario', '🍄', 'A1', 1, 'A video game hero with a red cap', ['You are not real.', 'You are in video games.', 'You wear a red cap and you have a moustache.'], ['game'], ['super mario']],
    ['harry-potter', 'Harry Potter', '⚡', 'A2', 1, 'A young wizard', ['You are not real.', 'You go to a special school.', 'You are a wizard with glasses.'], ['book', 'film'], ['harry']],
    ['pikachu', 'Pikachu', '🐹', 'A2', 1, 'A yellow electric Pokémon', ['You are not real.', 'You are small and yellow.', 'You are the most famous Pokémon.'], ['game', 'cartoon'], ['pikachú']],
    ['shrek', 'Shrek', '🧅', 'A2', 2, 'A green ogre who lives in a swamp', ['You are not real.', 'You are big and green.', 'You are an ogre and your best friend is a donkey.'], ['film'], []],
    ['wonder-woman', 'Wonder Woman', '🛡️', 'A2', 2, 'An Amazon warrior superhero', ['You are not real.', 'You are a superhero and a woman.', 'You are an Amazon princess with a magic lasso.'], ['superhero'], ['wonderwoman', 'diana prince']],
    ['darth-vader', 'Darth Vader', '🌑', 'B1', 2, 'The masked villain of Star Wars', ['You are not real.', 'You are a villain in space films.', 'You wear a black mask and breathe loudly.'], ['film'], ['vader', 'anakin skywalker']],
    ['sherlock-holmes', 'Sherlock Holmes', '🔍', 'B1', 3, 'A brilliant London detective', ['You are not real.', 'You live in London.', 'You are a detective and your friend is Dr Watson.'], ['book'], ['sherlock', 'holmes']],
    ['hermione-granger', 'Hermione Granger', '📚', 'B1', 3, "Harry Potter's cleverest friend", ['You are not real.', 'You study at a school of magic.', 'You are the brightest student and a friend of Harry Potter.'], ['book', 'film'], ['hermione', 'hermione grainger']],
  ],
);
