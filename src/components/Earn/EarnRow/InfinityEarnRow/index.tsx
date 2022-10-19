import React, { Component } from 'react';
import styles from '../styles.styl';
import '../style.scss'
import cn from 'classnames';
import { Accordion, Grid, Icon, Image, Input, Segment, Rating } from 'semantic-ui-react';
import SoftTitleValue from '../../SoftTitleValue';
import DepositContainer from '../DepositContainer';
import WithdrawStakeContainer from './WithdrawStakeContainer';
import { UserStoreEx } from '../../../../stores/UserStore';
import { observer } from 'mobx-react';
import { Text } from '../../../Base';
import stores, { useStores } from 'stores';
import Theme from 'themes';
import MigrateAssets from '../../MigrateTokens';
import { DetailsTab } from './DetailsTab';
import RewardsTab from './RewardsTab';
import { getViewingKey, notify } from '../../../../blockchain-bridge';
import UnstakeButton from './UnstakeButton';
import StakeButton from './StakeButton';
import { aprString, multipliers, RewardsToken } from '..';
import { unlockJsx } from 'components/SefiModal/utils';
import { formatRoi, ModalExplanation, ModalMultiplierTip } from 'components/Earn/APRModalExp';
import { formatZeroDecimals } from 'utils';

@observer
class InfinityEarnRow extends Component<
  {
    userStore: UserStoreEx;
    token: RewardsToken;
    notify: Function;
    callToAction: string;
    theme: Theme;
    isSefiStaking?: boolean;
    favPools?: string[];
    setFavPools?: React.Dispatch<React.SetStateAction<string[]>>;
  },
  {
    activeIndex: Number;
    stakeValue: string;
    unstakeValue: string;
    withdrawValue: string;
    updateWithdrawStake: boolean;
    claimButtonPulse: boolean;
    pulseInterval: number;
    secondary_token: any;
    vkey: any;
  }
> {
  state = {
    activeIndex: -1,
    stakeValue: '0.0',
    unstakeValue: '0.0',
    withdrawValue: '0.0',
    updateWithdrawStake: false,
    claimButtonPulse: true,
    pulseInterval: -1,
    secondary_token: {
      image: '',
      symbol: '',
    },
    vkey: undefined,
  };

  _isMounted = false;

  async componentDidMount() {
    this._isMounted = true;
    //auto open for SEFI STAKING page
    if (this.props.isSefiStaking) {
      setTimeout(() => {
        this.handleClick('', { index: 0 });
      }, 100);
    }
    const viewingKey = await getViewingKey({
      keplr: this.props.userStore.keplrWallet,
      chainId: this.props.userStore.chainId,
      address: this.props.token.rewardsContract,
    });

    if (this._isMounted)
      this.setState({ vkey: viewingKey })
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  handleChangeStake = event => {
    this.setState({ stakeValue: event.target.value });
  };

  handleChangeUnstake = event => {
    this.setState({ unstakeValue: event.target.value });
  };

  handleChangeWithdraw = () => {
    this.setState({ withdrawValue: this.state.withdrawValue });
  };

  handleUpdateWithdrawStake = () => {
    this.setState({ updateWithdrawStake: !this.state.updateWithdrawStake });
  };

  handleClick = (e, titleProps) => {
    const { index } = titleProps;
    const { activeIndex } = this.state;
    const newIndex = activeIndex === index ? -1 : index;
    if (activeIndex === -1) {
      this.props.userStore.refreshTokenBalanceByAddress(this.props.token.lockedAssetAddress);
      this.props.userStore.refreshRewardsBalances('', this.props.token.rewardsContract);
    }
    this.setState({ activeIndex: newIndex });
  };

  togglePulse = () =>
    this.setState(prevState => ({
      claimButtonPulse: !prevState.claimButtonPulse,
    }));

  clearPulseInterval = () => clearInterval(this.state.pulseInterval);

  setPulseInterval = interval => this.setState({ pulseInterval: interval });

  unCapitalize = s => {
    if (typeof s !== 'string') {
      return '';
    }
    return s.charAt(0).toLowerCase() + s.slice(1);
  };
  getBaseTokenName = (tokenName: string): string => {
    if (!tokenName) {
      return '';
    }

    tokenName = tokenName.toUpperCase();

    if (tokenName == 'SSCRT' || tokenName == 'SEFI' || tokenName == 'SCRT') {
      return tokenName;
    } else {
      if (tokenName.charAt(0) == 'S') {
        return tokenName.slice(1);
      } else {
        return tokenName;
      }
    }
  };

  createViewingKey = (noun?: string) => {
    return unlockJsx({
      onClick: async () => {
        try {
          let currency;
          if (this.props.token.rewardsSymbol == 'SEFI') {
            currency = this.props.token.rewardsSymbol;
          } else {
            currency = this.props.token.rewardsSymbol.toLowerCase();
          }

          if (this.props.userStore.isUnconnected) {
            if(this.props.userStore.isKeplrWallet){
              this.props.userStore.signIn();
            }else{
              console.log("Not keplr extention")
              notify("error","It seems like you don't have Keplr extention installed in your browser. Install Keplr, reload the page and try again");
            }
          }

          await this.props.userStore?.keplrWallet?.suggestToken(this.props.userStore?.chainId, this.props.token.rewardsContract);
          this.props.userStore.refreshTokenBalanceByAddress(this.props.token.rewardsContract);
          this.props.userStore.refreshRewardsBalances('', this.props.token.rewardsContract);
          this.props.userStore.updateScrtBalance();

          const viewingKey = await getViewingKey({
            keplr: this.props.userStore.keplrWallet,
            chainId: this.props.userStore.chainId,
            address: this.props.token.rewardsContract,
          });

          this.setState({ vkey: viewingKey })

        } catch (error) {
          notify("error",`Failed to create key: ${error.toString()}`);
          console.error('Failed to create or refresh key:', error);
        }
      },
      noun: noun
    });
  };

  render() {

    const isDetails = window.location.hash === '#Details';
    const isRewards = window.location.hash === '#Rewards';

    if (!isDetails && !isRewards) {
      window.location.hash = 'Details';
      return <></>;
    }

    const style = `${styles.accordion} ${styles[this.props.theme.currentTheme]}`;
    const { activeIndex } = this.state;
    const _symbols = this.props.token.lockedAsset?.toUpperCase().split('-');

    let tokenName;
    if (_symbols[1] == 'SEFI') {
      tokenName = _symbols[1] + ' - ' + this.unCapitalize(_symbols[2]);
    } else if (_symbols[2] == 'SEFI') {
      tokenName = this.unCapitalize(_symbols[1]) + ' - ' + _symbols[2];
    } else {
      tokenName = this.unCapitalize(_symbols[1]) + ' - ' + this.unCapitalize(_symbols[2]);
    }
    const isDeprecated = this.props.token.deprecated && this.props.token.deprecated_by !== '';
    let title = 'INFINITY POOL';

    return (
      <div className={`${styles.standard_row}`}>
      <Accordion className={cn(style)}>
        <Accordion.Title
          active={activeIndex === 0}
          index={0}
          onClick={this.handleClick}
          className={`${styles.assetRow} ${styles.responsive_row}`}
        >
          {this.props.favPools &&
          <Rating onRate={(e) => {
            e.stopPropagation()
            let newFavPools = this.props.favPools
            if (newFavPools.includes(this.props.token.rewardsContract)) {
              this.props.setFavPools(newFavPools.filter((t) => {return t !== this.props.token.rewardsContract}))
            } else {
              this.props.setFavPools([...newFavPools, this.props.token.rewardsContract])
            }
          }} size='huge' defaultRating={Number(this.props.favPools.includes(this.props.token.rewardsContract))} className={`title_star ${this.props.theme.currentTheme}`}/>}
          {
            <div className={cn(styles.assetIcon)}>
              <Image src={'/static/token-images/sefi.svg'} rounded size="mini" />
              <Image src={'/static/infinity-icon.png'} rounded size="mini" />
            </div>
          }

          <div className={cn(styles.title_item__container, styles.title_name)}>
            <SoftTitleValue title={title} subTitle="    " />
          </div>
          <div className={cn(styles.title_item__container, styles.title_apr)}>
            <SoftTitleValue
              title={
                <div className="earn_center_ele">
                  {aprString(this.props.token)}
                  {!isDeprecated && !this.props.token.zero && (
                    <p style={{ marginLeft: '5px', fontFamily: 'poppins', fontSize: '17px' }}>
                      <ModalExplanation token={this.props.token} theme={this.props.theme}>
                        <img width="14px" src="/static/info.svg" alt="" style={{filter: "invert(60%) sepia(19%) saturate(1005%) hue-rotate(357deg) brightness(101%) contrast(97%)"}}/>
                      </ModalExplanation>
                    </p>
                  )}
                </div>
              }
              subTitle={'APR'}
            />
          </div>
          <div className={cn(styles.title_item__container, styles.title_tvl)}>
            <SoftTitleValue
              title={`$${formatZeroDecimals(Number(this.props.token.totalLockedRewards) || 0)}`}
              subTitle={'TVL'}
            />
          </div>
          <div className={cn(styles.title_item__container, styles.title_multiplier)}>
            <SoftTitleValue
              title={
                <div className="earn_center_ele">
                  {multipliers['INFINITY POOL'] + 'x'}
                  <p style={{ marginLeft: '5px', fontFamily: 'poppins', fontSize: '17px' }}>
                    <ModalMultiplierTip multiplier={multipliers['INFINITY POOL']} theme={this.props.theme}>
                      <img width="14px" src="/static/info.svg" alt="" style={{filter: "invert(60%) sepia(19%) saturate(1005%) hue-rotate(357deg) brightness(101%) contrast(97%)"}}/>
                    </ModalMultiplierTip>
                  </p>
                </div>
              }
              subTitle={'Multiplier'}
            />
          </div>
          <div className={cn(styles.title_item__container, styles.title_arrow)}>
            <Icon
              className={`${styles.arrow}`}
              style={{
                color: this.props.theme.currentTheme == 'dark' ? 'white' : '',
              }}
              name="dropdown"
            />
          </div>
        </Accordion.Title>
        <Accordion.Content
          className={`${styles.content} ${styles[this.props.theme.currentTheme]}`}
          active={activeIndex === 0}
        >
          {this.props.token.deprecated ? (
            <div className="maintenance-warning">
              <h3>
                <Icon name="warning circle" />A new version of this earn pool is live. You can migrate by clicking the
                button below
              </h3>
            </div>
          ) : (
            <></>
          )}

          <div>
            <Segment basic>
              <Grid className={cn(styles.content2)} columns={2} relaxed="very" stackable>
                <Grid.Column>
                  {isDeprecated ? (
                    <>
                      <h1 style={{ color: this.props.theme.currentTheme == 'dark' ? 'white' : '#1B1B1B' }}>
                        Earn on the new pool!
                      </h1>
                      <MigrateAssets
                        balance={this.props.token.deposit}
                        oldRewardsContract={this.props.token.rewardsContract}
                        newRewardsContract={this.props.token.deprecated_by}
                        lockedAsset={this.props.token.lockedAsset}
                        lockedAssetAddress={this.props.token.lockedAssetAddress}
                      >
                        <p style={{ color: this.props.theme.currentTheme == 'dark' ? 'white' : '#1B1B1B' }}>
                          Migrate your tokens here.
                          <button className={`migrate-solid-button ${stores.theme.currentTheme}`}>Migrate</button>
                        </p>
                      </MigrateAssets>
                    </>
                  ) : (
                    <DepositContainer
                      title="Stake"
                      value={this.state.stakeValue}
                      action={
                        !isDeprecated && (
                          <>
                            <Grid columns={1} stackable relaxed={'very'}>
                              <Grid.Column
                                style={{
                                  display: 'flex',
                                  justifyContent: 'flex-start',
                                }}
                              >
                                <StakeButton
                                  props={this.props}
                                  token={this.props.token}
                                  value={this.state.stakeValue}
                                  changeValue={this.handleChangeStake}
                                  togglePulse={this.togglePulse}
                                  setPulseInterval={this.setPulseInterval}
                                />
                              </Grid.Column>
                            </Grid>
                          </>
                        )
                      }
                      onChange={this.handleChangeStake}
                      balance={this.props.token.balance}
                      currency={this.props.token.lockedAsset}
                      price={this.props.token.price}
                      balanceText="Available"
                      unlockPopupText="Staking balance and rewards require an additional viewing key."
                      tokenAddress={this.props.token.lockedAssetAddress}
                      userStore={this.props.userStore}
                      theme={this.props.theme}
                    />
                  )}
                </Grid.Column>
                <Grid.Column>
                  <DepositContainer
                    title="Unstake"
                    value={this.state.unstakeValue}
                    onChange={this.handleChangeUnstake}
                    action={
                      <Grid>
                        <Grid.Column style={{
                                  display: 'flex',
                                  justifyContent: 'flex-end',
                                }}>
                          <div style={{marginRight: "10px", textAlign: "right"}}>
                            Unstaking has a 10 day<br/>zero rewards unlock period
                          </div>
                          <span style={{marginRight: "-0.25em"}}>
                            <UnstakeButton
                              props={this.props}
                              token={this.props.token}
                              value={this.state.unstakeValue}
                              changeValue={this.handleChangeUnstake}
                              onUpdate={this.handleUpdateWithdrawStake}
                              togglePulse={this.togglePulse}
                              setPulseInterval={this.setPulseInterval}
                            />
                          </span>
                        </Grid.Column>
                      </Grid>
                    } //({props: this.props, value: this.state.withdrawValue})}
                    balance={this.props.token.deposit}
                    currency={this.props.token.lockedAsset}
                    price={this.props.token.price}
                    balanceText="Available"
                    unlockPopupText="Staking balance and rewards require an additional viewing key."
                    tokenAddress={this.props.token.rewardsContract}
                    userStore={this.props.userStore}
                    theme={this.props.theme}
                    createKey={this.createViewingKey}
                    vkey={this.state.vkey}
                  />
                </Grid.Column>
              </Grid>
              <Grid className={`${styles.content2} withdraw-content`} columns={2} relaxed="very" stackable>
                <Grid.Column>
                </Grid.Column>
                <Grid.Column className='withdraw-content-col'>
                    <WithdrawStakeContainer
                    props={this.props}
                    value={this.state.withdrawValue}
                    onUpdate={this.handleUpdateWithdrawStake}
                    updateWithdrawStake={this.state.updateWithdrawStake}
                    currency={this.props.token.lockedAsset}
                    balanceText="Available unstaked tokens"
                    unlockPopupText="Staking balance and rewards require an additional viewing key."
                    tokenAddress={this.props.token.rewardsContract}
                    userStore={this.props.userStore}
                    theme={this.props.theme}
                    token={this.props.token}
                    createKey={this.createViewingKey}
                    vkey={this.state.vkey}
                    />
                </Grid.Column>
              </Grid>
              <Grid className={`${styles.content2} infinity-info-content`} columns={2} relaxed="very" stackable>
                <Grid.Column className='infinity-info-col'>
                <Image style={{marginBottom: '15px'}} src={'/static/infinity-pool.png'}/>
                  <Text
                    size="medium"
                    style={{
                      padding: '20 20 0 20',
                      cursor: 'auto',
                      textAlign: 'center',
                      fontFamily: 'Poppins,Arial',
                      color: this.props.theme.currentTheme == 'dark' ? 'white' : '#1B1B1B',
                    }}
                  >
            Every time you Stake, Unstake, or Claim the contract will automagically claim your rewards for you
          </Text>
          </Grid.Column>
          <Grid.Column className='infinity-info-col infinity-details'>
              {isDetails && (
                  <DetailsTab
                    notify={notify}
                    token={this.props.token}
                    userStore={this.props.userStore}
                    theme={this.props.theme}
                  />
                )}
                {isRewards && (
                  <RewardsTab
                    notify={notify}
                    token={this.props.token}
                    userStore={this.props.userStore}
                    theme={this.props.theme}
                    createKey={this.createViewingKey}
                    vkey={this.state.vkey}
                  />
                )}
          </Grid.Column>
              </Grid>
            </Segment>
          </div>
        </Accordion.Content>
      </Accordion>
      </div>
    );
  }
}

export default InfinityEarnRow;
