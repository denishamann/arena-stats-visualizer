import Papa from "papaparse";
import React, { useState } from "react";
import Modal from "./modal";
import useModal from "./useModal";

export default function App() {
  const { isShowing: isImportFormShowed, toggle: toggleImportForm } =
    useModal();

  const [importString, setImportString] = useState("");
  const [totalMatches, setTotalMatches] = useState(0);
  const [totalWins, setTotalWins] = useState(0);
  const [statsForEachComposition, setStatsForEachComposition] = useState([]);

  const importConfirmed = () => {
    const result = Papa.parse(importString);
    const dataWithoutSkirm = cleanTitlesAndSkirmishes(result.data);
    const dataOnlyS3 = getOnlyS3Data(dataWithoutSkirm);
    const only2sData = cleanNon2sData(dataOnlyS3);
    const possibleCompositions = getAllPossibleCompositions(only2sData);

    const statsForEachComposition = getStatsForEachComposition(
      only2sData,
      possibleCompositions
    );

    setTotalMatches(
      statsForEachComposition.reduce((prev, curr) => prev + curr.total, 0)
    );
    setTotalWins(
      statsForEachComposition.reduce((prev, curr) => prev + curr.wins, 0)
    );

    setStatsForEachComposition(statsForEachComposition);

    toggleImportForm();
  };

  const cleanTitlesAndSkirmishes = (data) => {
    data.shift();
    return data.filter((row) => row[0] !== "NO");
  };

  const getOnlyS3Data = (data) => {
    const s3BeginTs = 1643065200;
    return data.filter((row) => row[1] > s3BeginTs);
  };

  const cleanNon2sData = (data) => {
    return data.filter((row) => row[10] === "");
  };

  const getAllPossibleCompositions = (data) => {
    const compositions = new Set();
    data.forEach((row) => {
      if (row[37] && row[38]) {
        const arr = [row[37], row[38]].sort((a, b) => a.localeCompare(b));
        compositions.add(`${arr[0]}+${arr[1]}`);
      }
    });
    return Array.from(compositions).sort((a, b) => a.localeCompare(b));
  };

  const getStatsForEachComposition = (data, possibleCompositions) => {
    const stats = possibleCompositions.map((comp) => {
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

    data.forEach((row) => {
      const index = stats.findIndex(
        (s) =>
          s.comp === `${row[37]}+${row[38]}` ||
          s.comp === `${row[38]}+${row[37]}`
      );
      if (index !== -1) {
        stats[index].total = stats[index].total + 1;
        if (row[47] === "ALLIANCE") {
          stats[index].aTotal = stats[index].aTotal + 1;
        } else if (row[47] === "HORDE") {
          stats[index].hTotal = stats[index].hTotal + 1;
        }
        if ((row[6] && row[7] && row[6] === row[7]) || row[25] > 0) {
          stats[index].wins = stats[index].wins + 1;
          if (row[47] === "ALLIANCE") {
            stats[index].aWins = stats[index].aWins + 1;
          } else if (row[47] === "HORDE") {
            stats[index].hWins = stats[index].hWins + 1;
          }
        }
      } else {
        console.log("error with row", row);
      }
    });

    return stats.sort((a, b) => b.total - a.total);
  };

  return (
    <>
      <div className="App">
        <button className="modal-toggle" onClick={toggleImportForm}>
          Import
        </button>

        <p>
          Notice: It automatically removes all skirmished and all non 2s matches
          and all matches before S3 begin
        </p>
        <strong>Total matches: {totalMatches}</strong>
        <br />
        <strong className="total-wins">Total wins: {totalWins}</strong>
        <br />
        <strong>Total ratio: {(totalWins / totalMatches).toFixed(2)}</strong>
        <table className="data-table">
          <tbody>
            <tr>
              <th>Composition</th>
              <th>Total matches</th>
              <th>Wins</th>
              <th>Losses</th>
              <th>Ratio</th>
            </tr>
            {statsForEachComposition.map((item, i) => (
              <tr key={i}>
                <td>{item.comp}</td>
                <td>
                  {item.total} (<span className="green">{item.aTotal}</span> +{" "}
                  <span className="red">{item.hTotal}</span>)
                </td>
                <td>
                  {item.wins} (<span className="green">{item.aWins}</span> +{" "}
                  <span className="red">{item.hWins}</span>)
                </td>
                <td>
                  {item.total - item.wins} (
                  <span className="green">{item.aTotal - item.aWins}</span> +{" "}
                  <span className="red">{item.hTotal - item.hWins}</span>)
                </td>
                <td>{(item.wins / item.total).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="green">Green = Alliance</p>
        <p className="red">Red = Horde</p>

        <Modal
          isShowing={isImportFormShowed}
          hide={toggleImportForm}
          title="Import"
        >
          <div className="form-group">
            <textarea
              rows="20"
              cols="60"
              value={importString}
              onChange={(e) => setImportString(e.target.value)}
            ></textarea>
          </div>
          <div className="form-group">
            <button className="import-confirmed" onClick={importConfirmed}>
              Import
            </button>
          </div>
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
          background-color: turquoise;
          cursor: pointer;
          padding: 1rem 2rem;
          text-transform: uppercase;
          border: none;
        }

        button.modal-toggle:not(:first-child) {
          margin-left: 10px;
        }

        .form-group {
          margin-top: 10px;
        }
        .total-wins {
          margin-bottom: 10px;
        }
        .data-table {
          margin-top: 10px;
        }
        .red {
          color: red;
        }
        .green {
          color: green;
        }
      `}</style>
    </>
  );
}
