echo $PWD 

export WORKDIR=$1
export RES=$2

# TODO: right now WORKDIR is misleading because it's not adding prefix before path
# So it's more similar to a path prefix than a work directory lol
export SEMGREP="${WORKDIR}/${WORKDIR}-semgrep.sarif"
export CODEQL="${WORKDIR}/${WORKDIR}-codeql.sarif"

echo "Semgrep sarif path is $SEMGREP" 
echo "CodeQL sarif path is $CODEQL" 
echo "Resulting sarif path is $RES" 

# TODO: UNDERSTAND JQ AND SED I KNOW NOTHING
export SCANNED=$(jq  ".runs[0].results[0].locations[0].physicalLocation.artifactLocation.uri" $CODEQL)
SCANNED="${SCANNED%\"}"
SCANNED="${SCANNED#\"}"
SCANNED=$(echo $SCANNED | tr  "/" "-") 
COPY_NAME=$(echo $SCANNED | sed "s/yaml/sarif/g")

echo "File scanned is $SCANNED" 
echo "File backup is $COPY_NAME" 
echo "Merging $SEMGREP and $CODEQL"  
mv $SRC $COPY_NAME
if [ -f "$CODEQL" ]; then
    echo "$CODEQL exists, merging $SEMGREP into it."
    node utils/aggregate-sarif.js $CODEQL $SEMGREP $RES
else
    echo "$CODEQL does not exist, setting bootstrap."
    cp $COPY_NAME $CODEQL 
fi 
