import { TweenService } from "@rbxts/services";

const Transition: TweenInfo = new TweenInfo(4, Enum.EasingStyle.Quad, Enum.EasingDirection.Out);
const Generator: Random = new Random();

const FadeIn = (Song: Sound, Volume = 1): void => {
    TweenService.Create(Song, Transition, {
        Volume: Volume
    }).Play();
}

const FadeOut = (Song: Sound): void => {
    const Fade: Tween = TweenService.Create(Song, Transition, {
        Volume: 0
    });

    Fade.Completed.Once(() => Song.Stop());
    Fade.Play();
}

const Shuffle = <T>(array: T[]): T[] => {
    let currentIndex = array.size(),  randomIndex;

    // While there remain elements to shuffle.
    while (currentIndex !== 0) {
  
      // Pick a remaining element.
      randomIndex = math.floor(math.random() * currentIndex);
      currentIndex--;
  
      // And swap it with the current element.
      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex], array[currentIndex]];
    }
  
    return array;
};

export class Soundtrack {
    public Songs: Readonly<Sound[]> = [];
    public Playing = false;
    
    private Active = 1;
    private Reference: SoundGroup;
    // private Transitioning = false;

    constructor(Reference: SoundGroup) {
        this.Reference = Reference;

        Reference.GetChildren().forEach((Value: Instance) => {
            if (Value.IsA("Sound")) {
                if (!Value.IsLoaded) Value.Loaded.Wait();

                Value.Volume = 0;
                (this.Songs as Sound[]).push(Value);
            }
        })

        this.Songs = table.freeze(this.Songs);
        this.Playing = true;
    }

    public async set(Property: WritablePropertyNames<Sound>, Value: number) {
        this.Songs.forEach((Value: WritableProperties<Sound>) => {
            (Value as any[WritablePropertyNames<Sound>])[Property] = Value;
        })
    }

    public Play(): Sound {
        const CurrentIndex: number = this.Active;
        const Active: Sound = this.Songs[CurrentIndex];
        const TimeLength: number = math.max((Active.TimeLength - Active.TimePosition) - Transition.Time, 0);

        task.delay(TimeLength, (): void => {
            if (Active.Playing && this.Playing && (CurrentIndex === this.Active)) this.Skip();
        })

        Active.Volume = this.Reference.Volume;
        (Active as any["Play" | "Resume"])[Active.IsPaused ? "Resume" : "Play"]();

        this.Playing = true;

        return Active;
    }

    public Pause(): ThisType<Soundtrack> {
        this.Songs[this.Active].Pause();
        this.Playing = false;

        return this;
    }

    public Stop(): ThisType<Soundtrack> {
        this.Songs[this.Active].Stop();
        this.Playing = false;

        return this;
    }

    public Skip(To = ((this.Active === this.Songs.size()) ? 1 : (this.Active + 1))): Sound {
        FadeOut(this.Songs[this.Active]);

        const NextSong: Sound = this.Songs[To];

        FadeIn(NextSong);
        this.Active = To;
        this.Play();

        return NextSong;
    }

    public Shuffle(): ThisType<Soundtrack> {
        this.Stop();
        this.Songs = Shuffle(table.clone(this.Songs));

        return this;
    }
}