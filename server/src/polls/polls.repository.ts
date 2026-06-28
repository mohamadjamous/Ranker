import { Inject, Injectable, InternalServerErrorException, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Redis } from "ioredis";
import { IORedisKey } from "src/redis.module";
import { AddNominationData, AddParticipantData, AddParticipantRankingsData, CreatePollData } from "./types";
import { Poll } from 'shared';



@Injectable()
export class PollsRepository {

    private readonly ttl: string;
    private readonly logger = new Logger(PollsRepository.name);


    constructor(
        configService: ConfigService,
        @Inject(IORedisKey) private readonly redisClient : Redis,
    ) {
        this.ttl = configService.get('POLL_DURATION') ?? '3600';
    }


    // create poll
    async createPoll({
        votesPerVoter,
        topic,
        pollID,
        userID,
    } : CreatePollData ) : Promise<Poll>{

        const initialPoll = {
            id : pollID,
            topic,
            votesPerVoter,
            participants: {},
            adminID: userID,
            hasStarted: false,
            nominations: {},
            rankings: {}
        }

        this.logger.log(
            `Creating new poll: ${JSON.stringify(initialPoll, null, 2)} with TTL ${this.ttl}` 
        );

        const key = `polls:${pollID}`;
        

        try{
            await this.redisClient.multi(
                [
                    ['send_command', 'JSON.SET', key, '.', JSON.stringify(initialPoll)],
                    ['expire', key, this.ttl]
                ]    
            )
            .exec();
            return initialPoll;
        }catch (e){
            this.logger.error(`Failed to add poll: ${e}`);
            throw new InternalServerErrorException();
        }
    }


    // get poll
    async getPoll(pollID: string) : Promise<Poll> {
        this.logger.log(`Attempting to get poll with: ${pollID}`);

        const key = `polls:${pollID}`;

        try{
            const currentPoll = await this.redisClient.send_command('JSON.GET', key, '.');

            this.logger.verbose(currentPoll);
            

            return JSON.parse(currentPoll);
        }catch(e){
            this.logger.error(`Failed to get poll: ${e}`);
            throw new InternalServerErrorException(`Failed to get pollID ${pollID}`);
        }
    }


    // add participant

    async addParticipant({
        pollID,
        userID,
        name
    } : AddParticipantData) : Promise<Poll> {

        this.logger.log(`Attempting to add participant with userID/name ${userID}/${name} to pollID ${pollID}`);

        const key = `polls:${pollID}`;
        const participantPath = `.participants.${userID}`;

        try{
            
            await this.redisClient.send_command('JSON.SET' , key, participantPath, JSON.stringify(name));

            return this.getPoll(pollID);
        }catch(e){
            this.logger.error(
                `Failed to add participant with userID/name ${userID}/${name} to pollID ${pollID}: ${e}`
            )
            throw new InternalServerErrorException(`
                Failed to add a participant with userID/name: ${userID}/${name} to
                pollID: ${pollID}`,);
        }
        
    }

    async removeParticipant(pollID: string, userID: string): Promise<Poll> {
    this.logger.log(`removing userID: ${userID} from poll: ${pollID}`);

    const key = `polls:${pollID}`;
    const participantPath = `.participants.${userID}`;

    try {
      await this.redisClient.send_command('JSON.DEL', key, participantPath);

      return this.getPoll(pollID);
    } catch (e) {
      this.logger.error(
        `Failed to remove userID: ${userID} from poll: ${pollID}`,
        e,
      );
      throw new InternalServerErrorException('Failed to remove participant');
    }
  }


  async addNomination({
    pollID,
    nominationID,
    nomination,
  } : AddNominationData) : Promise<Poll>{
    this.logger.log(`
        Attempting to add a nomination with nominationID/nominations: ${
            nominationID}/${nomination.text} to pollID: ${pollID}`)

    const key = `polls:${pollID}`;
    const nominationPath = `.nominations.${nominationID}`;

    try {
        await this.redisClient.send_command(
            'JSON.SET',
            key,
            nominationPath,
            JSON.stringify(nomination)
        );
        return this.getPoll(pollID);
    } catch (e) {
        this.logger.error(
            `Failed to add a nomination with nominationID/text: ${nominationID}/${
                nomination.text} to pollID: ${pollID}`, e
        );

        throw new InternalServerErrorException(
            `Failed to add a nomiation with nominationID/text: ${nominationID}/${
                nomination.text
            }, to pollID: ${pollID}`,
        );
        

    }
  }



  async removeNomination(pollID: string, nominationID: string) : Promise<Poll>{

    this.logger.log(
        `removing nominatiobID: ${nominationID} from poll: ${pollID}`
    );

    const key = `polls:${pollID}`;
    const nominationPath = `.nominations.${nominationID}`;

    try {
        
        await this.redisClient.send_command('JSON.DEL', key, nominationPath);

        return this.getPoll(pollID);
    } catch (e) {
        this.logger.error(
            `Failed to remove nominationID: ${nominationID} from poll ${pollID}`, e
        );

        throw new InternalServerErrorException(
            `Failed to remove nominationID: ${nominationID} from poll ${pollID}`,
        );
    }
  }

  
  async startPoll(pollID : string): Promise<Poll>{
    this.logger.log(
        `setting hasStarted for poll ${pollID}`
    );

    const key = `polls:${pollID}`;

    try {

        await this.redisClient.send_command(
            'JSON.SET',
            key,
            '.hasStarted',
            JSON.stringify(true)
        );

        return this.getPoll(pollID);
    } catch (e) {
        this.logger.error(
            `Failed set hasStarted for poll ${pollID}`, e
        );
        throw new InternalServerErrorException(
            'There was an error starting the poll'
        );
    }
  }



  async addParticipantRankings({
    pollID,
    userID,
    rankings,
  }: AddParticipantRankingsData): Promise<Poll> {
    this.logger.log(
      `Attempting to add rankings for userID/name: ${userID} to pollID: ${pollID}`,
      rankings,
    );

    const key = `polls:${pollID}`;
    const rankingsPath = `.rankings.${userID}`;

    try {
      await this.redisClient.send_command(
        'JSON.SET',
        key,
        rankingsPath,
        JSON.stringify(rankings),
      );

      return this.getPoll(pollID);
    } catch (e) {
      this.logger.error(
        `Failed to add a rankings for userID/name: ${userID}/ to pollID: ${pollID}`,
        rankings,
      );
      throw new InternalServerErrorException(
        'There was an error starting the poll',
      );
    }
  }

}

