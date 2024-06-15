import 'bootstrap/dist/css/bootstrap.css';
import Papa from 'papaparse';
import React, { useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  Container,
  Form,
  Modal,
  Row as BootstrapRow,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Accordion,
} from 'react-bootstrap';
import { computeBadges } from './badgeLogic';
import {
  ALL_CLASSES,
  DEFAULT_BRACKETS,
  DEFAULT_SEASONS,
  timestampsOk,
} from './constants';
import { Row } from './row';
import BootstrapTable from 'react-bootstrap-table-next';
import * as icons from './icons';
import 'react-bootstrap-table-next/dist/react-bootstrap-table2.min.css';
import AccordionItem from 'react-bootstrap/esm/AccordionItem';
import AccordionHeader from 'react-bootstrap/esm/AccordionHeader';
import AccordionBody from 'react-bootstrap/esm/AccordionBody';

export default function App() {
  // React state
  const [showModal, setShowModal] = useState(false);
  const [importString, setImportString] = useState('');
  const [cleanData, setCleanData] = useState([]);
  const [corruptedCount, setCorruptedCount] = useState(0);
  const [seasons, setSeasons] = useState(DEFAULT_SEASONS);
  const [brackets, setBrackets] = useState(DEFAULT_BRACKETS);
  const [playerClasses, setPlayerClasses] = useState(ALL_CLASSES);
  const [showSpecs, setShowSpecs] = useState(true);

  // Inferred state
  let totalMatches = 0;
  let totalWins = 0;
  let statsForEachComposition = [];
  let badges = [];
  let winrates = [];

  if (!timestampsOk())
    console.log('Error in arena season start/end timestamps!');

  const handleShowModal = () => setShowModal(true);
  const handleCloseModal = () => setShowModal(false);

  // Import logic - compute state based on imported string
  const importConfirmed = () => {
    const parsed = Papa.parse(importString).data;
    const result = parsed.flatMap(row =>
      row.length > 1 ? [new Row(row)] : []
    ); // skip empty lines in input string
    const dataWithoutSkirm = result.filter(row => !row.isTitleOrSkirmish());
    const cleanData = cleanCorruptedData(dataWithoutSkirm);
    setCorruptedCount(dataWithoutSkirm.length - cleanData.length);
    setCleanData(cleanData);
    handleCloseModal();
  };

  const cleanCorruptedData = data => {
    console.log(
      'Corrupted data',
      data.filter(row => !row.isRowClean())
    );
    return data.filter(row => row.isRowClean());
  };

  // Rendering logic - compute inferred state based on state (i.e. user inputs)
  const processState = () => {
    if (cleanData.length) {
      const seasonSpecificData = getSeasonSpecificData(cleanData);
      const bracketAndSeasonSpecificData =
        getBracketSpecificData(seasonSpecificData);
      const playerClassSpecificData = getPlayerClassSpecificData(
        bracketAndSeasonSpecificData
      );
      const possibleCompositions = getAllPossibleCompositions(
        playerClassSpecificData
      );
      statsForEachComposition = getStatsForEachComposition(
        playerClassSpecificData,
        possibleCompositions
      );

      winrates = getStatsAgainstClassesAndSpecs(
        playerClassSpecificData,
        showSpecs
      );

      totalMatches = statsForEachComposition.reduce(
        (prev, curr) => prev + curr.total,
        0
      );
      totalWins = statsForEachComposition.reduce(
        (prev, curr) => prev + curr.wins,
        0
      );

      badges = computeBadges(playerClassSpecificData);
    }
  };

  const getSeasonSpecificData = data => {
    return data.filter(
      row =>
        (row.isSeasonOne() && seasons.includes('s1')) ||
        (row.isSeasonTwo() && seasons.includes('s2')) ||
        (row.isSeasonThree() && seasons.includes('s3')) ||
        (row.isSeasonFour() && seasons.includes('s4')) ||
        (row.isSeasonFive() && seasons.includes('s5')) ||
        (row.isSeasonSix() && seasons.includes('s6')) ||
        (row.isSeasonSeven() && seasons.includes('s7')) ||
        (row.isSeasonEight() && seasons.includes('s8')) ||
        (row.isSeasonNineOrLater() && seasons.includes('s9'))
    );
  };

  const getBracketSpecificData = data => {
    return data.filter(
      row =>
        (row.is2sData() && brackets.includes('2s')) ||
        (row.is3sData() && brackets.includes('3s')) ||
        (row.is5sData() && brackets.includes('5s'))
    );
  };

  const getPlayerClassSpecificData = data => {
    return data.filter(row =>
      row.allyClasses().every(v => playerClasses.includes(v))
    );
  };

  const getAllPossibleCompositions = data => {
    const compositions = new Set();
    data.forEach(row => {
      const comp = row.getComposition(brackets, showSpecs);
      if (comp !== '') {
        compositions.add(comp);
      }
    });
    return Array.from(compositions).sort((a, b) => a.localeCompare(b)); // this .sort is useless; it will be re-sorted by wins anyway
  };

  const getStatsAgainstClassesAndSpecs = (data, showSpecs) => {
    const stats = [];

    for (const row of data) {
      const comp = row.getComposition(brackets, showSpecs);

      for (const player of comp.split('+')) {
        let clazz = '';
        let spec = '';

        if (showSpecs) {
          [clazz, spec] = player.split('%');
        } else {
          clazz = player;
        }

        if (clazz === '') {
          continue;
        }

        let index = stats.findIndex(s => s.clazz === clazz && s.spec === spec);

        if (index !== -1) {
          stats[index].total = stats[index].total + 1;
          if (row.won()) {
            stats[index].wins = stats[index].wins + 1;
          }
        } else {
          stats.push({
            clazz: clazz,
            spec: spec,
            total: 1,
            wins: row.won() ? 1 : 0,
          });
        }
      }
    }

    return stats.sort((a, b) => b.wins / b.total > a.wins / a.total);
  };

  const getStatsForEachComposition = (data, possibleCompositions) => {
    const stats = possibleCompositions.map(comp => {
      return {
        comp,
        total: 0,
        wins: 0,
        aTotal: 0,
        aWins: 0,
        hTotal: 0,
        hWins: 0,
      };
    });

    data.forEach(row => {
      const comp = row.getComposition(brackets, showSpecs);
      if (comp !== '') {
        const index = stats.findIndex(s => s.comp === comp);
        if (index !== -1) {
          stats[index].total = stats[index].total + 1;
          if (row.enemyFaction === 'ALLIANCE') {
            stats[index].aTotal = stats[index].aTotal + 1;
          } else if (row.enemyFaction === 'HORDE') {
            stats[index].hTotal = stats[index].hTotal + 1;
          }
          if (row.won()) {
            stats[index].wins = stats[index].wins + 1;
            if (row.enemyFaction === 'ALLIANCE') {
              stats[index].aWins = stats[index].aWins + 1;
            } else if (row.enemyFaction === 'HORDE') {
              stats[index].hWins = stats[index].hWins + 1;
            }
          }
        } else {
          console.log('Error with row', row);
        }
      }
    });

    return stats.sort((a, b) => b.total - a.total);
  };

  processState();

  const columns = [
    {
      dataField: 'composition',
      text: 'Enemy composition',
      sort: true,
      formatter: cell => {
        const classes = cell.split('+');
        return (
          <div key={cell}>
            {classes.map((clazz, idx) => (
              <img
                key={idx + clazz}
                src={classIcon(clazz)}
                width={'32'}
                height={'32'}
                alt={clazz}
              />
            ))}
          </div>
        );
      },
      sortValue: cell => {
        // sort by bracket (2s -> 3s -> 5s -> unknown bracket/unknown class included) and then by ALL_CLASSES order
        const classes = cell.split('+');
        const firstCode = 'A'.charCodeAt(0); // 65
        const indices = classes.map(clazz =>
          ALL_CLASSES.indexOf(clazz) === -1
            ? 'Z'
            : String.fromCharCode(firstCode + ALL_CLASSES.indexOf(clazz))
        ); // 'A' for warrior, 'B' for hunter... and 'Z' for unknown
        return (
          (indices.length === 0 || indices.includes('Z')
            ? 'Z'
            : '' + indices.length) + indices.join('')
        ); // prefix with '2', '3', '5' or 'Z' depending on the bracket
      },
      headerStyle: (column, colIndex) => {
        return { width: '200px' };
      },
    },
    {
      dataField: 'total',
      text: 'Total matches',
      sort: true,
      formatter: cell => {
        const item = JSON.parse(cell);
        return (
          <div>
            {item.total} <span className="blue">({item.aTotal}</span> +{' '}
            <span className="red">{item.hTotal}</span>)
          </div>
        );
      },
      sortValue: cell => JSON.parse(cell).total,
      headerStyle: (column, colIndex) => {
        return { width: '175px' };
      },
    },
    {
      dataField: 'wins',
      text: 'Wins',
      sort: true,
      formatter: cell => {
        const item = JSON.parse(cell);
        return (
          <div>
            {item.wins} <span className="blue">({item.aWins}</span> +{' '}
            <span className="red">{item.hWins}</span>)
          </div>
        );
      },
      sortValue: cell => JSON.parse(cell).wins,
      headerStyle: (column, colIndex) => {
        return { width: '175px' };
      },
    },
    {
      dataField: 'losses',
      text: 'Losses',
      sort: true,
      formatter: cell => {
        const item = JSON.parse(cell);
        return (
          <div>
            {item.total - item.wins}{' '}
            <span className="blue">({item.aTotal - item.aWins}</span> +{' '}
            <span className="red">{item.hTotal - item.hWins}</span>)
          </div>
        );
      },
      sortValue: cell => {
        const item = JSON.parse(cell);
        return item.total - item.wins;
      },
      headerStyle: (column, colIndex) => {
        return { width: '175px' };
      },
    },
    {
      dataField: 'percent',
      text: '%',
      sort: true,
      formatter: cell => {
        const item = JSON.parse(cell);
        return <div>{((item.wins / item.total) * 100).toFixed(1)}</div>;
      },
      sortValue: cell => {
        const item = JSON.parse(cell);
        return item.wins / item.total;
      },
      headerStyle: (column, colIndex) => {
        return { width: '90px' };
      },
    },
    {
      dataField: 'aPercent',
      text: '% (A)',
      headerFormatter: (column, colIndex, components) => (
        <div>
          <img
            src={icons.alliance}
            width={'24'}
            height={'24'}
            alt={'alliance'}
          />{' '}
          %{components.sortElement}
        </div>
      ),
      sort: true,
      formatter: cell => {
        const item = JSON.parse(cell);
        return (
          <div className="blue">
            {item.aTotal !== 0
              ? ((item.aWins / item.aTotal) * 100).toFixed(1)
              : '-'}
          </div>
        );
      },
      sortValue: cell => {
        const item = JSON.parse(cell);
        return item.aTotal !== 0 ? item.aWins / item.aTotal : -1;
      },
      headerStyle: (column, colIndex) => {
        return { width: '90px' };
      },
    },
    {
      dataField: 'hPercent',
      text: '% (H)',
      headerFormatter: (column, colIndex, components) => (
        <div>
          <img src={icons.horde} width={'24'} height={'24'} alt={'horde'} /> %
          {components.sortElement}
        </div>
      ),
      sort: true,
      formatter: cell => {
        const item = JSON.parse(cell);
        return (
          <div className="red">
            {item.hTotal !== 0
              ? ((item.hWins / item.hTotal) * 100).toFixed(1)
              : '-'}
          </div>
        );
      },
      sortValue: cell => {
        const item = JSON.parse(cell);
        return item.hTotal !== 0 ? item.hWins / item.hTotal : -1;
      },
      headerStyle: (column, colIndex) => {
        return { width: '90px' };
      },
    },
  ];

  const content = statsForEachComposition.map(item => {
    return {
      composition: item.comp,
      total: JSON.stringify({
        total: item.total,
        aTotal: item.aTotal,
        hTotal: item.hTotal,
      }),
      wins: JSON.stringify({
        wins: item.wins,
        aWins: item.aWins,
        hWins: item.hWins,
      }),
      losses: JSON.stringify({
        total: item.total,
        wins: item.wins,
        aTotal: item.aTotal,
        aWins: item.aWins,
        hTotal: item.hTotal,
        hWins: item.hWins,
      }),
      percent: JSON.stringify({
        wins: item.wins,
        total: item.total,
      }),
      aPercent: JSON.stringify({
        aTotal: item.aTotal,
        aWins: item.aWins,
      }),
      hPercent: JSON.stringify({
        hTotal: item.hTotal,
        hWins: item.hWins,
      }),
    };
  });

  const classIcon = clazz => {
    const [classPart, specPart] = clazz.split('%');

    switch (classPart) {
      case 'WARRIOR':
        if (clazz.includes('%')) {
          if (specPart === 'Fury') {
            return icons.fury;
          } else if (specPart === 'Arms') {
            return icons.arms;
          } else if (specPart === 'Protection') {
            return icons.protection;
          } else {
            return icons.warrior;
          }
        } else {
          return icons.warrior;
        }
      case 'DEATHKNIGHT':
        if (clazz.includes('%')) {
          if (specPart === 'Frost') {
            return icons.frost;
          } else if (specPart === 'Unholy') {
            return icons.unholy;
          } else if (specPart === 'Blood') {
            return icons.blood;
          } else {
            return icons.deathknight;
          }
        } else {
          return icons.deathknight;
        }
      case 'PALADIN':
        if (clazz.includes('%')) {
          if (specPart === 'Holy') {
            return icons.holy;
          } else if (specPart === 'Protection') {
            return icons.protection;
          } else if (specPart === 'Retribution') {
            return icons.retribution;
          } else {
            return icons.paladin;
          }
        } else {
          return icons.paladin;
        }
      case 'HUNTER':
        if (clazz.includes('%')) {
          if (specPart === 'Beastmastery') {
            return icons.beastmastery;
          } else if (specPart === 'Marksmanship') {
            return icons.marksmanship;
          } else if (specPart === 'Survival') {
            return icons.survival;
          } else {
            return icons.hunter;
          }
        } else {
          return icons.hunter;
        }
      case 'SHAMAN':
        if (clazz.includes('%')) {
          if (specPart === 'Elemental') {
            return icons.elemental;
          } else if (specPart === 'Enhancement') {
            return icons.enhancement;
          } else if (specPart === 'Restoration') {
            return icons.restoration;
          } else {
            return icons.shaman;
          }
        } else {
          return icons.shaman;
        }
      case 'ROGUE':
        if (clazz.includes('%')) {
          if (specPart === 'Assassination') {
            return icons.assassination;
          } else if (specPart === 'Combat') {
            return icons.combat;
          } else if (specPart === 'Subtlety') {
            return icons.subtlety;
          } else {
            return icons.rogue;
          }
        } else {
          return icons.rogue;
        }
      case 'DRUID':
        if (clazz.includes('%')) {
          if (specPart === 'Balance') {
            return icons.balance;
          } else if (specPart === 'Feral') {
            return icons.feral;
          } else if (specPart === 'Restoration') {
            return icons.restorationDruid;
          } else {
            return icons.druid;
          }
        } else {
          return icons.druid;
        }
      case 'PRIEST':
        if (clazz.includes('%')) {
          if (specPart === 'Discipline') {
            return icons.discipline;
          } else if (specPart === 'Holy') {
            return icons.holy;
          } else if (specPart === 'Shadow') {
            return icons.shadow;
          } else {
            return icons.priest;
          }
        } else {
          return icons.priest;
        }
      case 'MAGE':
        if (clazz.includes('%')) {
          if (specPart === 'Arcane') {
            return icons.arcane;
          } else if (specPart === 'Fire') {
            return icons.fire;
          } else if (specPart === 'Frost') {
            return icons.frostMage;
          } else {
            return icons.mage;
          }
        } else {
          return icons.mage;
        }
      case 'WARLOCK':
        if (clazz.includes('%')) {
          if (specPart === 'Affliction') {
            return icons.affliction;
          } else if (specPart === 'Demonology') {
            return icons.demonology;
          } else if (specPart === 'Destruction') {
            return icons.destruction;
          } else {
            return icons.warlock;
          }
        } else {
          return icons.warlock;
        }
      default:
        return icons.unknown;
    }
  };

  return (
    <>
      <div className="App">
        <Container>
          <Button className="modal-toggle" onClick={handleShowModal}>
            Import
          </Button>

          <Stack className="float-end">
            <div>
              <img
                src={icons.github}
                width={'28'}
                height={'24'}
                alt={'github'}
              />
              Contribute to the tool{' '}
              <a href="https://github.com/denishamann/arena-stats-visualizer">
                on Github
              </a>
            </div>
            <div>
              <img
                src={icons.github}
                width={'28'}
                height={'24'}
                alt={'github'}
              />
              Contribute to the addon{' '}
              <a href="https://github.com/denishamann/ArenaStats">on Github</a>
            </div>
            <div>
              <img
                src={icons.curse}
                width={'20'}
                height={'20'}
                alt={'curse'}
                style={{ marginLeft: '5px', marginRight: '3px' }}
              />
              Get the addon{' '}
              <a href="https://www.curseforge.com/wow/addons/arenastats">
                on CurseForge
              </a>
            </div>
          </Stack>
        </Container>

        {!cleanData.length ? (
          <Container className="alerts-onboarding">
            <Alert key={'alert-infos'} variant={'primary'}>
              <Alert.Heading>Notice</Alert.Heading>
              This is a visualizer for the Classic (TBC/WOTLK/etc) addon
              "ArenaStats" It allows you to import your data in order to analyze
              them by bracket, by season, by enemy composition, and much more
              (to come!) All you have to do is click on the "Export" button
              in-game, copy the String, click on the "Import" button here, and
              paste it.
            </Alert>
            <Alert key={'alert-data'} variant={'warning'}>
              It automatically removes all skirmishes.
            </Alert>
            <Alert key={'alert-trimming'} variant={'warning'}>
              You will only see stats for matches played since you installed the
              addon.
            </Alert>
            <Alert key={'alert-leaving'} variant={'warning'}>
              If you want to leave a match in-game before it is ended, make sure
              you are the last one of your team alive. Otherwise, data for that
              particular match won't be recorded by the addon.
            </Alert>
          </Container>
        ) : (
          <Container fluid>
            <div className="main-content">
              <div className="settings">
                <div>
                  <Form>
                    <Form.Check
                      type="checkbox"
                      id={'checkbox_specs'}
                      label={`Show Specs`}
                      checked={showSpecs}
                      onChange={() => setShowSpecs(!showSpecs)}
                    />
                  </Form>
                </div>
                <div>
                  <h2>Brackets</h2>
                  <ToggleButtonGroup
                    type="checkbox"
                    defaultValue={DEFAULT_BRACKETS}
                    onChange={setBrackets}
                  >
                    <ToggleButton
                      id="bracket-2s"
                      value={'2s'}
                      variant={'outline-primary'}
                    >
                      2v2
                    </ToggleButton>
                    <ToggleButton
                      id="bracket-3s"
                      value={'3s'}
                      variant={'outline-primary'}
                    >
                      3v3
                    </ToggleButton>
                    <ToggleButton
                      id="bracket-5s"
                      value={'5s'}
                      variant={'outline-primary'}
                    >
                      5v5
                    </ToggleButton>
                  </ToggleButtonGroup>
                </div>
                <div className="seasons">
                  <Accordion defaultActiveKey={0}>
                    <AccordionItem eventKey="0">
                      <AccordionHeader>Seasons</AccordionHeader>
                      <AccordionBody>
                        <ToggleButtonGroup
                          type="checkbox"
                          defaultValue={DEFAULT_SEASONS}
                          vertical={true}
                          size="lg"
                          onChange={setSeasons}
                        >
                          <ToggleButton
                            id="season-1"
                            value={'s1'}
                            variant={'outline-primary'}
                          >
                            Season 1
                          </ToggleButton>
                          <ToggleButton
                            id="season-2"
                            value={'s2'}
                            variant={'outline-primary'}
                          >
                            Season 2
                          </ToggleButton>
                          <ToggleButton
                            id="season-3"
                            value={'s3'}
                            variant={'outline-primary'}
                          >
                            Season 3
                          </ToggleButton>
                          <ToggleButton
                            id="season-4"
                            value={'s4'}
                            variant={'outline-primary'}
                          >
                            Season 4
                          </ToggleButton>
                          <ToggleButton
                            id="season-5"
                            value={'s5'}
                            variant={'outline-primary'}
                          >
                            Season 5
                          </ToggleButton>
                          <ToggleButton
                            id="season-6"
                            value={'s6'}
                            variant={'outline-primary'}
                          >
                            Season 6
                          </ToggleButton>
                          <ToggleButton
                            id="season-7"
                            value={'s7'}
                            variant={'outline-primary'}
                          >
                            Season 7
                          </ToggleButton>
                          <ToggleButton
                            id="season-8"
                            value={'s8'}
                            variant={'outline-primary'}
                          >
                            Season 8
                          </ToggleButton>
                          <ToggleButton
                            id="season-9"
                            value={'s9'}
                            variant={'outline-primary'}
                          >
                            Season 9+
                          </ToggleButton>
                        </ToggleButtonGroup>
                      </AccordionBody>
                    </AccordionItem>
                  </Accordion>
                </div>
              </div>
              <div>
                <div className="header-stats">
                  <strong>Total matches: {totalMatches}</strong>
                  <strong>Total wins: {totalWins}</strong>
                  {!!totalMatches && (
                    <strong>
                      Total win rate:{' '}
                      {((totalWins / totalMatches) * 100).toFixed(2)}%
                    </strong>
                  )}
                  <strong>Team composition: </strong>
                  <ToggleButtonGroup
                    type="checkbox"
                    defaultValue={ALL_CLASSES}
                    onChange={setPlayerClasses}
                    className="as-toggle-button-groups"
                  >
                    {ALL_CLASSES.map(cl => (
                      <ToggleButton
                        id={cl + '-toggle-button'}
                        value={cl}
                        variant={'outline-primary'}
                      >
                        <img
                          src={classIcon(cl)}
                          width={'32'}
                          height={'32'}
                          alt={cl}
                        />
                      </ToggleButton>
                    ))}
                  </ToggleButtonGroup>
                  <p>
                    <span className="blue">Blue = vs Alliance</span>{' '}
                    <span className="red">Red = vs Horde</span>
                  </p>
                </div>
                <BootstrapTable
                  keyField="composition"
                  data={content}
                  columns={columns}
                  defaultSorted={[{ dataField: 'total', order: 'desc' }]}
                  bootstrap4={true}
                  striped={true}
                  bordered={true}
                  hover={true}
                  classes={'data-table'}
                />
                <Container>
                  <BootstrapRow
                    xs={1}
                    sm={2}
                    md={2}
                    lg={3}
                    xl={4}
                    xxl={4}
                    className="g-4"
                  >
                    {badges.map(badge => (
                      <Col key={badge.title}>
                        <Card
                          key={badge.title}
                          border={badge.appearance}
                          style={{ height: '100%' }}
                        >
                          <Card.Header as="h5">{badge.title}</Card.Header>
                          <Card.Body>
                            <Card.Text className="mb-2 text-muted">
                              {badge.details ? (
                                badge.details
                              ) : (
                                <ul className="sober">
                                  {badge.detailsArray.map(it => (
                                    <li>{it}</li>
                                  ))}
                                </ul>
                              )}
                            </Card.Text>
                          </Card.Body>
                        </Card>
                      </Col>
                    ))}
                  </BootstrapRow>
                </Container>
                <br />
                <p>
                  Skipped <strong className="red">{corruptedCount}</strong>{' '}
                  unprocessable records (all seasons/brackets considered). Open
                  console to inspect them if needed.
                </p>
              </div>
              <div className="random-stats">
                <div>
                  <h2>Win %</h2>
                  <div className="winrates-class">
                    {winrates.map(x => {
                      return (
                        <div className="winrate-item">
                          <img
                            key={x.clazz + '%' + x.spec}
                            src={classIcon(x.clazz + '%' + x.spec)}
                            width={'32'}
                            height={'32'}
                            alt={x.clazz}
                          />
                          <span className="winrate-text">
                            {parseFloat((x.wins / x.total) * 100).toFixed(1) +
                              '%'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <h2>Games vs.</h2>
                  <div className="winrates-class">
                    {winrates
                      .sort((a, b) => a.total < b.total)
                      .map(x => {
                        return (
                          <div className="winrate-item">
                            <img
                              key={x.clazz + '%' + x.spec}
                              src={classIcon(x.clazz + '%' + x.spec)}
                              width={'32'}
                              height={'32'}
                              alt={x.clazz}
                            />
                            <span className="winrate-text">{x.total}</span>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            </div>
          </Container>
        )}

        <Modal centered size="lg" show={showModal} onHide={handleCloseModal}>
          <Modal.Header closeButton>
            <Modal.Title>Import</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Export string from addon</Form.Label>
                <Form.Control
                  autoFocus
                  as="textarea"
                  rows={20}
                  cols={50}
                  value={importString}
                  onChange={e => setImportString(e.target.value)}
                />
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="primary"
              className="import-confirmed"
              onClick={importConfirmed}
            >
              Import
            </Button>
          </Modal.Footer>
        </Modal>
      </div>

      <style jsx="true">{`
        .App {
          height: 100vh;
          // display: flex;
          // justify-content: center;
          align-items: center;
        }

        button.modal-toggle,
        .import-confirmed {
          background-color: darkgray;
          cursor: pointer;
          padding: 1rem 2rem;
          text-transform: uppercase;
          border: none;
          margin-top: 10px;
        }
        .data-table {
          margin-top: 10px;
          text-align: center;
        }
        .data-table th:hover {
          background-color: aliceblue;
        }
        .red {
          color: #dc3545;
        }
        .blue {
          color: #0dcaf0;
        }
        .alerts-onboarding {
          margin-top: 100px;
        }
        .as-toggle-button-groups {
          margin: 10px 0 10px 0;
        }
        .as-toggle-button-groups > label {
          margin: 0 10px 0 0;
          border-radius: 0.25rem !important;
          overflow: hidden;
        }
        .as-toggle-button-groups > label:hover {
          background-color: lightsteelblue;
          color: white;
        }
        .as-toggle-button-groups > .btn-check:checked + .btn:hover {
          background-color: cornflowerblue;
          color: lightsteelblue;
        }
        ul.sober {
          list-style-type: none;
          padding-left: 3px;
        }
      `}</style>
    </>
  );
}
