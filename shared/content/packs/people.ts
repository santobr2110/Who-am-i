import { definePack } from '../define';

export default definePack(
  { id: 'people', name: 'People', emoji: '🌟', description: 'Famous people from music, sport, science and history.' },
  [
    ['taylor-swift', 'Taylor Swift', '🎤', 'A1', 1, 'American singer and songwriter', ['You are a woman.', 'You are from the USA.', 'You are a very famous singer.'], ['music', 'usa'], ['taylor']],
    ['cristiano-ronaldo', 'Cristiano Ronaldo', '⚽', 'A1', 1, 'Portuguese football player', ['You are a man.', 'You are from Portugal.', 'You play football and wear number 7.'], ['sport', 'portugal'], ['ronaldo', 'cr7']],
    ['lionel-messi', 'Lionel Messi', '🥅', 'A1', 1, 'Argentinian football player', ['You are a man.', 'You are from Argentina.', 'You won the World Cup in 2022.'], ['sport', 'argentina'], ['messi', 'leo messi']],
    ['beyonce', 'Beyoncé', '👑', 'A1', 1, 'American singer and performer', ['You are a woman.', 'You are from the USA.', 'You are a singer and people call you Queen B.'], ['music', 'usa'], ['beyonce knowles']],
    ['neymar', 'Neymar', '🇧🇷', 'A1', 1, 'Brazilian football player', ['You are a man.', 'You are from Brazil.', 'You are a famous football player.'], ['sport', 'brazil'], ['neymar jr', 'neymar junior']],
    ['anitta', 'Anitta', '🎶', 'A1', 1, 'Brazilian singer', ['You are a woman.', 'You are from Rio de Janeiro.', 'You are a Brazilian pop singer.'], ['music', 'brazil']],
    ['albert-einstein', 'Albert Einstein', '🧠', 'A2', 2, 'Physicist who created the theory of relativity', ['You are not alive today.', 'You were a scientist.', 'You are famous for E = mc².'], ['science', 'history'], ['einstein']],
    ['leonardo-da-vinci', 'Leonardo da Vinci', '🎨', 'A2', 2, 'Italian artist and inventor', ['You lived more than 500 years ago.', 'You were from Italy.', 'You painted the Mona Lisa.'], ['art', 'history'], ['da vinci', 'leonardo']],
    ['pele', 'Pelé', '🏆', 'A2', 2, 'Brazilian football legend', ['You are not alive today.', 'You were from Brazil.', 'You won three World Cups.'], ['sport', 'brazil'], ['edson arantes do nascimento']],
    ['serena-williams', 'Serena Williams', '🎾', 'A2', 2, 'American tennis champion', ['You are a woman.', 'You are an athlete from the USA.', 'You won many tennis Grand Slams.'], ['sport', 'usa'], ['serena']],
    ['frida-kahlo', 'Frida Kahlo', '🌺', 'B1', 3, 'Mexican painter known for her self-portraits', ['You were an artist.', 'You were from Mexico.', 'You painted many portraits of yourself.'], ['art', 'mexico'], ['frida']],
    ['nelson-mandela', 'Nelson Mandela', '✊', 'B1', 3, 'South African leader who fought apartheid', ['You were a political leader.', 'You spent many years in prison.', 'You became president of South Africa.'], ['history', 'politics'], ['mandela']],
    ['marie-curie', 'Marie Curie', '⚗️', 'B1', 3, 'Scientist who won two Nobel Prizes', ['You were a scientist.', 'You were born in Poland and worked in France.', 'You won two Nobel Prizes for your work on radioactivity.'], ['science', 'history'], ['curie', 'madame curie']],
    ['william-shakespeare', 'William Shakespeare', '🎭', 'B1', 3, 'English playwright and poet', ['You were a writer.', 'You lived in England about 400 years ago.', 'You wrote Romeo and Juliet.'], ['literature', 'history'], ['shakespeare']],
  ],
);
