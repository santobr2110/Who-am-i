import { definePack } from '../define';

export default definePack(
  { id: 'professions', name: 'Professions', emoji: '💼', description: 'Jobs people do every day.' },
  [
    ['doctor', 'Doctor', '🩺', 'A1', 1, 'Helps sick people get better', ['You work with people.', 'You work in a hospital.', 'You help sick people.'], ['health'], ['a doctor', 'physician']],
    ['teacher', 'Teacher', '🍎', 'A1', 1, 'Helps students learn', ['You work with people.', 'You work in a school.', 'You help students learn.'], ['education'], ['a teacher', 'professor']],
    ['chef', 'Chef', '👨‍🍳', 'A1', 1, 'Cooks food in a restaurant', ['You work in a kitchen.', 'You wear a tall white hat.', 'You cook food in a restaurant.'], ['food'], ['cook', 'a chef']],
    ['pilot', 'Pilot', '✈️', 'A1', 1, 'Flies aeroplanes', ['You wear a uniform.', 'You travel a lot.', 'You fly planes.'], ['travel'], ['a pilot', 'airline pilot']],
    ['firefighter', 'Firefighter', '🚒', 'A1', 1, 'Puts out fires and rescues people', ['You wear a uniform.', 'You drive a big red truck.', 'You stop fires.'], ['safety'], ['fireman', 'fire fighter']],
    ['police-officer', 'Police Officer', '👮', 'A1', 1, 'Keeps people safe', ['You wear a uniform.', 'You work in the city.', 'You keep people safe and stop crime.'], ['safety'], ['police', 'policeman', 'policewoman', 'cop']],
    ['dentist', 'Dentist', '🦷', 'A2', 1, 'Takes care of teeth', ['You work with people.', 'People open their mouth for you.', 'You take care of teeth.'], ['health'], ['a dentist']],
    ['farmer', 'Farmer', '🚜', 'A2', 1, 'Grows food and raises animals', ['You work outside.', 'You work with plants and animals.', 'You grow food on a farm.'], ['food', 'nature'], ['a farmer']],
    ['architect', 'Architect', '📐', 'B1', 2, 'Designs buildings', ['You work in an office and visit construction sites.', 'You make drawings and plans.', 'You design houses and buildings.'], ['design'], ['an architect']],
    ['software-developer', 'Software Developer', '💻', 'B1', 2, 'Writes code to build apps and websites', ['You work on a computer all day.', 'You can often work from home.', 'You write code to make apps.'], ['technology'], ['developer', 'programmer', 'software engineer', 'coder']],
    ['journalist', 'Journalist', '📰', 'B1', 2, 'Reports the news', ['You ask a lot of questions.', 'You write or talk about what is happening.', 'You report the news.'], ['media'], ['reporter', 'a journalist']],
    ['astronaut', 'Astronaut', '🚀', 'A2', 2, 'Travels and works in space', ['You need a lot of training.', 'You wear a very special suit.', 'You travel to space.'], ['science', 'space'], ['an astronaut', 'cosmonaut']],
    ['lawyer', 'Lawyer', '⚖️', 'B1', 3, 'Advises people about the law', ['You study for many years.', 'You sometimes work in a courtroom.', 'You help people with legal problems.'], ['law'], ['attorney', 'a lawyer']],
    ['psychologist', 'Psychologist', '🛋️', 'B2', 3, 'Helps people understand their minds and feelings', ['You work with people.', 'You listen much more than you talk.', 'You help people with their thoughts and emotions.'], ['health'], ['therapist', 'a psychologist']],
  ],
);
