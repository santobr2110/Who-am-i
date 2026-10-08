import { definePack } from '../define';

export default definePack(
  { id: 'animals', name: 'Animals', emoji: '🦁', description: 'From the savannah to the ocean.' },
  [
    ['lion', 'Lion', '🦁', 'A1', 1, 'The king of the jungle', ['You have four legs.', 'You live in Africa.', 'You are a big cat and people call you the king.'], ['africa', 'wild'], ['a lion']],
    ['penguin', 'Penguin', '🐧', 'A1', 1, 'A bird that swims but cannot fly', ['You are a bird.', 'You live in very cold places.', 'You are black and white and you cannot fly.'], ['bird', 'cold'], ['a penguin']],
    ['elephant', 'Elephant', '🐘', 'A1', 1, 'The largest land animal', ['You are very big.', 'You are grey.', 'You have a very long nose.'], ['africa', 'wild'], ['an elephant']],
    ['dolphin', 'Dolphin', '🐬', 'A1', 1, 'A clever animal that lives in the sea', ['You live in the ocean.', 'You are very intelligent.', 'You jump out of the water and you are not a fish.'], ['ocean'], ['a dolphin']],
    ['dog', 'Dog', '🐶', 'A1', 1, "People's best friend", ['You have four legs.', 'You live with people.', "You bark and you are people's best friend."], ['pet'], ['a dog', 'puppy']],
    ['cat', 'Cat', '🐱', 'A1', 1, 'A popular pet that purrs', ['You have four legs.', 'You live with people.', 'You say "meow".'], ['pet'], ['a cat', 'kitten']],
    ['giraffe', 'Giraffe', '🦒', 'A1', 1, 'The tallest animal', ['You live in Africa.', 'You eat leaves from tall trees.', 'You have a very long neck.'], ['africa', 'wild'], ['a giraffe']],
    ['monkey', 'Monkey', '🐒', 'A1', 1, 'A playful animal that climbs trees', ['You live in the forest.', 'You climb trees.', 'You love bananas.'], ['forest', 'wild'], ['a monkey']],
    ['shark', 'Shark', '🦈', 'A2', 1, 'A big fish with sharp teeth', ['You live in the ocean.', 'People are afraid of you.', 'You are a big fish with many sharp teeth.'], ['ocean'], ['a shark']],
    ['kangaroo', 'Kangaroo', '🦘', 'A2', 2, 'A jumping animal from Australia', ['You live in Australia.', 'You jump instead of walking.', 'You carry your baby in a pocket.'], ['australia'], ['a kangaroo']],
    ['owl', 'Owl', '🦉', 'A2', 2, 'A bird that is awake at night', ['You are a bird.', 'You sleep during the day.', 'You have big eyes and you say "hoo".'], ['bird', 'night'], ['an owl']],
    ['octopus', 'Octopus', '🐙', 'A2', 2, 'A sea animal with eight arms', ['You live in the ocean.', 'You have no bones.', 'You have eight arms.'], ['ocean'], ['an octopus']],
    ['sloth', 'Sloth', '🦥', 'B1', 2, 'A very slow animal that lives in trees', ['You live in the trees of Central and South America.', 'You sleep most of the day.', 'You are famous for being extremely slow.'], ['forest', 'brazil'], ['a sloth']],
    ['chameleon', 'Chameleon', '🦎', 'B1', 3, 'A reptile that changes colour', ['You are a reptile.', 'Your eyes move in different directions.', 'You can change your colour.'], ['reptile'], ['a chameleon']],
  ],
);
