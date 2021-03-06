// Reference: https://github.com/microsoft/sarif-tutorials/blob/main/docs/2-Basics.md
// Reference: https://github.com/jduimovich/collect-sarif-files

const fs = require('fs')
const args = process.argv.splice(2)

if (args.length < 3) {
    console.log("You must pass two file names and a result file path")
    console.log("Usage:", process.argv[0], " pathToSarif1 pathToSarif2 resultFilePath")
    process.exit(0)
}
const mergeInto = args[0]
const mergeFrom = args[1]
const resultFilePath = args[2]

// Actual execution
fs.readFile(mergeInto, 'utf8', function (_, mergeIntodata) {
    fs.readFile(mergeFrom, 'utf8', function (_, mergeFromdata) {
        const merged = aggregate(mergeIntodata, mergeFromdata)
        writeJSON(resultFilePath, merged, process.exit)
    })
})

// Main aggregation logic
function aggregate(s1, s2) {
    let j1 = JSON.parse(s1)
    let j2 = JSON.parse(s2)
    
    // If two sarifs originate from same tool (e.g. both semgrep), merge
    if (fromSameTool(j1, j2)) {
        return mergeRulesAndResults(j1, j2)
    }
    // Else, add as separate runs
    else {
        // TODO: even if they're from different tools, we probably want to
        // get rid of repetition in some way. The solution is to either
        // find some format that is able to label it as BOTH semgrep AND codeQL
        // or prefer one tool's analysis & discard the other
        const j1RunLength = j1.runs.length
        const j2RunLength = j2.runs.length
        for (let i = 0; i < j2RunLength; i++) {
            j1.runs[j1RunLength + i] = j2.runs[i]
        }
        return j1
    }
}

// Returns a boolean based on whether two sarif jsons originate from the same tool (e.g. "semgrep")
function fromSameTool(j1, j2) {
    const driver1 = j1.runs[0].tool.driver.name
    const driver2 = j2.runs[0].tool.driver.name
    if (!driver1) {
        console.log("No driver found for first file input")
        process.exit(0)
    }
    if (!driver2) {
        console.log("No driver found for second file input")
        process.exit(0)
    }
    return driver1 == driver2
}

// Is only ran when the same tool is used: combines result & gets rid of repetition
function mergeRulesAndResults(j1, j2) {
    let s1Rules = extractRules(j1)
    let s1Results = extractResults(j1)
    let s2Rules = extractRules(j2)
    let s2Results = extractResults(j1)

    console.log(`${mergeInto} rules found: ${s1Rules.length}`)
    console.log(`${mergeInto} results found: ${s1Results.length}`)
    console.log(`${mergeFrom} rules found: ${s2Rules.length}`)
    console.log(`${mergeFrom} results found: ${s2Results.length}`)

    let combinedRules = extractRules(j1).concat(extractRules(j2))
    let included = new Set()
    let newRules = []
    combinedRules.forEach(function (e) {
        if (!included.has(e.id)) {
            included.add(e.id)
            newRules.push(e)
        }
    })
    console.log("Number of rules combined is: ", newRules.length)
    insertRules(j1, newRules)
    let c = 0
    newRules.forEach(function (e) {
        console.log(c++, ':', e.id)
    })
    insertResults(j1, extractResults(j1).concat(extractResults(j2)))
    console.log("Number of source locations combined is: ", extractResults(j1).length)
    c = 0
    extractResults(j1).forEach(function (e) {
        console.log(c++, ':', e.ruleId)
    })
    return j1
}

/*
Each run represents a single invocation of a single analysis tool, and 
the run has to describe the tool that produced it.

Because of the way we ran these tools, we're confident that each sarif file
only has 1 run inside it and the following logic work.

However, in the future, it is probably important to be consistent and
be able to handle a sarif file with multiple runs.

Also, it would be more aligned to the SARIF schema if we separated these
different files into different runs.
*/

// insertRules takes in a sarif JSON and list of rules, and inserts the rules
function insertRules(sarif, rules) {
    sarif.runs[0].tool.driver.rules = rules
}

// insertResults takes in a sarif JSON and list of results, and inserts the results
function insertResults(sarif, result) {
    sarif.runs[0].results = result
}

// extractRules takes in a sarif JSON and returns a list of all the rules
function extractRules(sarif) {
    const runList = sarif.runs
    let rules = []

    runList.forEach(run => {
        const newRules = run.tool.driver.rules
        if (!newRules) {
            console.log("Invalid sarif file content: no rules found")
            process.exit(0)
        }
        rules.concat(newRules)
    })
    
    return rules
}

// extractResults takes in a sarif JSON and returns a list of all the results
function extractResults(sarif) {
    const runList = sarif.runs
    let results = []

    runList.forEach(run => {
        const newResults = run.results
        if (!newResults) {
            console.log("Invalid sarif file content: no results found")
            process.exit(0)
        }
        results = results.concat(newResults)
        console.log(results)
    })
    return results
}

// Simple function to write sarif into a file in JSON format
function writeJSON(file, value, then) {
    let stream = fs.createWriteStream(file)
    stream.once('open', function (_) {
        stream.write(JSON.stringify(value))
        stream.end()
        console.log("Created: ", file)
        then(0)
    })
}