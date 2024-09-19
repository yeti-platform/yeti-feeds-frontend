for definition in "Entity" "Observable" "Indicator"; do
    filename="src/definitions/private/private"$definition"Definitions.js"
    if [ ! -f $filename ];
    then
        upper_definition=$(echo $definition | tr '[:lower:]' '[:upper:]')
        echo "export const "PRIVATE_$upper_definition"_TYPES = []" >> $filename
    fi
done