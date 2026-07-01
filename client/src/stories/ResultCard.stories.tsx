import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';

import ResultCard from '../components/ui/ResultCard';
import { Results } from 'shared/poll-types';

export default {
  title: 'ResultCard',
  component: ResultCard,
} as ComponentMeta<typeof ResultCard>;

const Template: ComponentStory<typeof ResultCard> = (args) => (
  <div className="max-w-sm m-auto h-screen">
    <ResultCard {...args} />
  </div>
);

const results: Results = [
  {
    nominationID: '1',
    score: 3,
    nominationText: 'Taco Bell',
  },
  {
    nominationID: '2',
    score: 2,
    nominationText: 'Del Taco',
  },
  {
    nominationID: '3',
    score: 1,
    nominationText: "Papa's Tacos",
  },
  {
    nominationID: '4',
    score: 1,
    nominationText: 'Los Taqueros Locos con Nomre Largo',
  },
];

export const ResultCardLong = Template.bind({});
ResultCardLong.args = {
  results,
};

